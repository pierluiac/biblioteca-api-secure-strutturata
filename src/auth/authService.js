/**
 * Modulo Autenticazione JWT
 * Gestisce la generazione, validazione e gestione dei token JWT
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const database = require('./database');

class AuthService {
    /**
     * Genera un token JWT
     */
    static generateToken(payload, expiresIn = null) {
        const options = {
            expiresIn: expiresIn || config.jwt.expiresIn,
            algorithm: config.jwt.algorithm
        };

        return jwt.sign(payload, config.jwt.secret, options);
    }

    /**
     * Genera un refresh token
     */
    static generateRefreshToken(payload) {
        const options = {
            expiresIn: config.jwt.refreshExpiresIn,
            algorithm: config.jwt.algorithm
        };

        return jwt.sign(payload, config.jwt.secret, options);
    }

    /**
     * Verifica un token JWT
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, config.jwt.secret);
        } catch (error) {
            throw new Error('Token non valido');
        }
    }

    /**
     * Decodifica un token senza verifica (per debug)
     */
    static decodeToken(token) {
        return jwt.decode(token);
    }

    /**
     * Hash di una password
     */
    static async hashPassword(password) {
        return await bcrypt.hash(password, config.auth.bcryptRounds);
    }

    /**
     * Verifica una password
     */
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Genera un JTI (JWT ID) unico
     */
    static generateJTI() {
        return require('crypto').randomUUID();
    }

    /**
     * Aggiunge un token alla blacklist
     */
    static async blacklistToken(jti, userId, expiresAt) {
        const sql = `
            INSERT INTO token_blacklist (token_jti, user_id, expires_at)
            VALUES (?, ?, ?)
        `;
        
        await database.run(sql, [jti, userId, expiresAt]);
    }

    /**
     * Verifica se un token è nella blacklist
     */
    static async isTokenBlacklisted(jti) {
        const sql = 'SELECT id FROM token_blacklist WHERE token_jti = ?';
        const result = await database.get(sql, [jti]);
        return !!result;
    }

    /**
     * Pulisce i token scaduti dalla blacklist
     */
    static async cleanExpiredTokens() {
        const sql = 'DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP';
        const result = await database.run(sql);
        return result.changes;
    }

    /**
     * Registra una sessione utente
     */
    static async createSession(userId, jti, refreshToken, ipAddress, userAgent, expiresAt) {
        const sql = `
            INSERT INTO sessioni (user_id, token_jti, refresh_token, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const result = await database.run(sql, [userId, jti, refreshToken, ipAddress, userAgent, expiresAt]);
        return result.id;
    }

    /**
     * Elimina una sessione
     */
    static async deleteSession(jti) {
        const sql = 'DELETE FROM sessioni WHERE token_jti = ?';
        const result = await database.run(sql, [jti]);
        return result.changes > 0;
    }

    /**
     * Elimina tutte le sessioni di un utente
     */
    static async deleteUserSessions(userId) {
        const sql = 'DELETE FROM sessioni WHERE user_id = ?';
        const result = await database.run(sql, [userId]);
        return result.changes;
    }

    /**
     * Ottiene le sessioni attive di un utente
     */
    static async getUserSessions(userId) {
        const sql = `
            SELECT id, token_jti, ip_address, user_agent, created_at, expires_at
            FROM sessioni 
            WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
            ORDER BY created_at DESC
        `;
        
        return await database.all(sql, [userId]);
    }

    /**
     * Valida le credenziali di login
     */
    static async validateCredentials(email, password) {
        const sql = 'SELECT * FROM utenti WHERE email = ? AND account_bloccato = 0';
        const user = await database.get(sql, [email]);
        
        if (!user) {
            return { valid: false, error: 'Credenziali non valide' };
        }

        const isValidPassword = await this.verifyPassword(password, user.password_hash);
        
        if (!isValidPassword) {
            // Incrementa tentativi di login
            await this.incrementLoginAttempts(user.id);
            return { valid: false, error: 'Credenziali non valide' };
        }

        // Reset tentativi di login
        await this.resetLoginAttempts(user.id);
        
        // Aggiorna ultimo accesso
        await this.updateLastAccess(user.id);

        return { 
            valid: true, 
            user: {
                id: user.id,
                nome: user.nome,
                cognome: user.cognome,
                email: user.email,
                ruolo: user.ruolo,
                email_verificata: user.email_verificata
            }
        };
    }

    /**
     * Incrementa i tentativi di login
     */
    static async incrementLoginAttempts(userId) {
        const sql = `
            UPDATE utenti 
            SET tentativi_login = tentativi_login + 1,
                account_bloccato = CASE 
                    WHEN tentativi_login >= 4 THEN 1 
                    ELSE account_bloccato 
                END
            WHERE id = ?
        `;
        
        await database.run(sql, [userId]);
    }

    /**
     * Reset dei tentativi di login
     */
    static async resetLoginAttempts(userId) {
        const sql = 'UPDATE utenti SET tentativi_login = 0 WHERE id = ?';
        await database.run(sql, [userId]);
    }

    /**
     * Aggiorna l'ultimo accesso
     */
    static async updateLastAccess(userId) {
        const sql = 'UPDATE utenti SET ultimo_accesso = CURRENT_TIMESTAMP WHERE id = ?';
        await database.run(sql, [userId]);
    }

    /**
     * Verifica se un utente ha i permessi per una risorsa
     */
    static hasPermission(userRole, requiredRole) {
        const roleHierarchy = {
            'user': 1,
            'librarian': 2,
            'admin': 3
        };

        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }

    /**
     * Genera payload per token
     */
    static createTokenPayload(user) {
        return {
            sub: user.id,
            email: user.email,
            ruolo: user.ruolo,
            jti: this.generateJTI(),
            iat: Math.floor(Date.now() / 1000)
        };
    }
}

module.exports = AuthService;
