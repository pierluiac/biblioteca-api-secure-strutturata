/**
 * Controller Autenticazione
 * Gestisce login, registrazione, logout e gestione token
 */

const AuthService = require('../auth/authService');
const database = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { logSensitiveAction } = require('../middleware/auth');

class AuthController {
    /**
     * POST /api/auth/register - Registrazione nuovo utente
     */
    static register = [
        logSensitiveAction('REGISTER'),
        asyncHandler(async (req, res) => {
            const { nome, cognome, email, password, telefono, indirizzo } = req.body;

            // Validazione input
            const validation = AuthController.validateRegistration(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Dati di registrazione non validi',
                        status: 400,
                        details: validation.errors
                    }
                });
            }

            // Verifica se l'email esiste già
            const existingUser = await database.get('SELECT id FROM utenti WHERE email = ?', [email]);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        message: 'Un utente con questa email esiste già',
                        status: 409
                    }
                });
            }

            // Hash della password
            const passwordHash = await AuthService.hashPassword(password);

            // Crea l'utente
            const sql = `
                INSERT INTO utenti (nome, cognome, email, password_hash, telefono, indirizzo)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const result = await database.run(sql, [nome, cognome, email, passwordHash, telefono, indirizzo]);

            res.status(201).json({
                success: true,
                message: 'Utente registrato con successo',
                data: {
                    id: result.id,
                    nome,
                    cognome,
                    email,
                    ruolo: 'user'
                }
            });
        })
    ];

    /**
     * POST /api/auth/login - Login utente
     */
    static login = [
        logSensitiveAction('LOGIN'),
        asyncHandler(async (req, res) => {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Email e password sono richiesti',
                        status: 400
                    }
                });
            }

            // Valida le credenziali
            const validation = await AuthService.validateCredentials(email, password);
            
            if (!validation.valid) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: validation.error,
                        status: 401
                    }
                });
            }

            const user = validation.user;

            // Genera token
            const payload = AuthService.createTokenPayload(user);
            const accessToken = AuthService.generateToken(payload);
            const refreshToken = AuthService.generateRefreshToken({ sub: user.id, jti: payload.jti });

            // Registra la sessione
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore
            await AuthService.createSession(
                user.id,
                payload.jti,
                refreshToken,
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent') || 'Unknown',
                expiresAt.toISOString()
            );

            res.json({
                success: true,
                message: 'Login effettuato con successo',
                data: {
                    user: {
                        id: user.id,
                        nome: user.nome,
                        cognome: user.cognome,
                        email: user.email,
                        ruolo: user.ruolo
                    },
                    tokens: {
                        accessToken,
                        refreshToken,
                        expiresIn: '24h'
                    }
                }
            });
        })
    ];

    /**
     * POST /api/auth/refresh - Refresh del token
     */
    static refreshToken = asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Refresh token richiesto',
                    status: 400
                }
            });
        }

        try {
            const decoded = AuthService.verifyToken(refreshToken);
            
            // Verifica che il refresh token sia valido
            const session = await database.get(
                'SELECT * FROM sessioni WHERE refresh_token = ? AND expires_at > CURRENT_TIMESTAMP',
                [refreshToken]
            );

            if (!session) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Refresh token non valido',
                        status: 401
                    }
                });
            }

            // Ottieni i dati dell'utente
            const user = await database.get('SELECT * FROM utenti WHERE id = ?', [decoded.sub]);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Utente non trovato',
                        status: 401
                    }
                });
            }

            // Genera nuovo access token
            const payload = AuthService.createTokenPayload({
                id: user.id,
                email: user.email,
                ruolo: user.ruolo
            });
            
            const newAccessToken = AuthService.generateToken(payload);

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    expiresIn: '24h'
                }
            });

        } catch (error) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Refresh token non valido',
                    status: 401
                }
            });
        }
    });

    /**
     * POST /api/auth/logout - Logout utente
     */
    static logout = [
        logSensitiveAction('LOGOUT'),
        asyncHandler(async (req, res) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                try {
                    const decoded = AuthService.decodeToken(token);
                    
                    // Aggiungi il token alla blacklist
                    if (config.auth.tokenBlacklistEnabled) {
                        await AuthService.blacklistToken(decoded.jti, decoded.sub, new Date(decoded.exp * 1000));
                    }

                    // Elimina la sessione
                    await AuthService.deleteSession(decoded.jti);
                } catch (error) {
                    // Token già scaduto o non valido, continua comunque
                }
            }

            res.json({
                success: true,
                message: 'Logout effettuato con successo'
            });
        })
    ];

    /**
     * POST /api/auth/logout-all - Logout da tutti i dispositivi
     */
    static logoutAll = [
        logSensitiveAction('LOGOUT_ALL'),
        asyncHandler(async (req, res) => {
            const userId = req.user.id;

            // Elimina tutte le sessioni dell'utente
            const deletedSessions = await AuthService.deleteUserSessions(userId);

            res.json({
                success: true,
                message: 'Logout da tutti i dispositivi effettuato',
                data: {
                    deletedSessions
                }
            });
        })
    ];

    /**
     * GET /api/auth/me - Informazioni utente corrente
     */
    static getMe = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const user = await database.get(
            'SELECT id, nome, cognome, email, ruolo, telefono, indirizzo, email_verificata, ultimo_accesso, created_at FROM utenti WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Utente non trovato',
                    status: 404
                }
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                nome: user.nome,
                cognome: user.cognome,
                email: user.email,
                ruolo: user.ruolo,
                telefono: user.telefono,
                indirizzo: user.indirizzo,
                email_verificata: user.email_verificata,
                ultimo_accesso: user.ultimo_accesso,
                created_at: user.created_at
            }
        });
    });

    /**
     * GET /api/auth/sessions - Sessioni attive dell'utente
     */
    static getSessions = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const sessions = await AuthService.getUserSessions(userId);

        res.json({
            success: true,
            data: sessions.map(session => ({
                id: session.id,
                ip_address: session.ip_address,
                user_agent: session.user_agent,
                created_at: session.created_at,
                expires_at: session.expires_at,
                current: session.token_jti === req.user.jti
            }))
        });
    });

    /**
     * Valida i dati di registrazione
     */
    static validateRegistration(data) {
        const errors = [];

        if (!data.nome || data.nome.trim().length === 0) {
            errors.push('Il nome è obbligatorio');
        }

        if (!data.cognome || data.cognome.trim().length === 0) {
            errors.push('Il cognome è obbligatorio');
        }

        if (!data.email || data.email.trim().length === 0) {
            errors.push('L\'email è obbligatoria');
        } else if (!config.auth.emailRegex.test(data.email)) {
            errors.push('L\'email deve essere valida');
        }

        if (!data.password || data.password.length < config.auth.passwordMinLength) {
            errors.push(`La password deve essere di almeno ${config.auth.passwordMinLength} caratteri`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = AuthController;
