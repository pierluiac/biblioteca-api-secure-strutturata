/**
 * Server Principale - Biblioteca API Secure Strutturata
 * Architettura modulare con autenticazione JWT e separazione delle responsabilità
 */

const express = require('express');
const path = require('path');

// Importazione configurazione
const config = require('./config/config');
const database = require('./config/database');

// Importazione middleware
const { morganLogger, requestLogger, errorLogger } = require('./middleware/logging');
const { corsMiddleware, jsonParser, securityHeaders, apiInfo, addTimestamp } = require('./middleware/config');
const { notFoundHandler, errorHandler, jsonErrorHandler } = require('./middleware/errorHandler');
const { authenticateToken, authorize, rateLimitByUser } = require('./middleware/auth');

// Importazione routes
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');
const libriRoutes = require('./routes/libriRoutes');
const utentiRoutes = require('./routes/utentiRoutes');
const prestitiRoutes = require('./routes/prestitiRoutes');

class BibliotecaSecureServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Configurazione middleware
     */
    setupMiddleware() {
        // Middleware di sicurezza
        this.app.use(securityHeaders);
        this.app.use(apiInfo);
        this.app.use(addTimestamp);

        // Middleware CORS
        this.app.use(corsMiddleware);

        // Middleware di logging
        this.app.use(morganLogger);
        this.app.use(requestLogger);

        // Middleware di parsing
        this.app.use(jsonParser);
        this.app.use(express.urlencoded({ extended: true }));

        // Middleware per gestione errori JSON
        this.app.use(jsonErrorHandler);

        // Rate limiting per utenti autenticati
        this.app.use('/api', rateLimitByUser(100, 15 * 60 * 1000));
    }

    /**
     * Configurazione routes
     */
    setupRoutes() {
        // Routes pubbliche
        this.app.use('/', mainRoutes);
        this.app.use('/health', mainRoutes);
        this.app.use('/api', mainRoutes);
        this.app.use('/api/auth', authRoutes);

        // Routes protette
        this.app.use('/api/libri', authenticateToken, libriRoutes);
        this.app.use('/api/utenti', authenticateToken, utentiRoutes);
        this.app.use('/api/prestiti', authenticateToken, prestitiRoutes);
    }

    /**
     * Configurazione gestione errori
     */
    setupErrorHandling() {
        // Route 404
        this.app.use(notFoundHandler);

        // Middleware di logging errori
        this.app.use(errorLogger);

        // Middleware di gestione errori
        this.app.use(errorHandler);
    }

    /**
     * Inizializzazione database
     */
    async initializeDatabase() {
        try {
            await database.connect();
            await database.initializeTables();
            await database.seedData();
            console.log('✅ Database inizializzato correttamente');
        } catch (error) {
            console.error('❌ Errore inizializzazione database:', error.message);
            throw error;
        }
    }

    /**
     * Avvio del server
     */
    async start() {
        try {
            // Inizializza database
            await this.initializeDatabase();

            // Avvia server
            this.server = this.app.listen(config.server.port, config.server.host, () => {
                console.log(`🔐 Biblioteca API Secure Server Strutturato in ascolto su ${config.server.host}:${config.server.port}`);
                console.log(`📚 Ambiente: ${config.server.environment}`);
                console.log(`📚 Versione API: ${config.api.version}`);
                console.log(`📚 Database: ${config.database.path}`);
                console.log(`📚 JWT Secret: ${config.jwt.secret.substring(0, 10)}...`);
                console.log(`📚 API disponibili:`);
                console.log(`   - GET    /health`);
                console.log(`   - GET    /api`);
                console.log(`   - GET    /api/status`);
                console.log(`   - POST   /api/auth/register`);
                console.log(`   - POST   /api/auth/login`);
                console.log(`   - GET    /api/libri (protetto)`);
                console.log(`   - GET    /api/utenti (protetto)`);
                console.log(`   - GET    /api/prestiti (protetto)`);
                console.log(`📚 Documentazione: http://${config.server.host}:${config.server.port}/api`);
            });

            // Gestione chiusura graceful
            this.setupGracefulShutdown();

        } catch (error) {
            console.error('❌ Errore avvio server:', error.message);
            process.exit(1);
        }
    }

    /**
     * Configurazione chiusura graceful
     */
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Ricevuto segnale ${signal}. Chiusura graceful...`);
            
            if (this.server) {
                this.server.close(async () => {
                    console.log('✅ Server HTTP chiuso');
                    
                    try {
                        // Pulisci token scaduti prima della chiusura
                        const AuthService = require('./auth/authService');
                        const cleanedTokens = await AuthService.cleanExpiredTokens();
                        console.log(`✅ Puliti ${cleanedTokens} token scaduti`);
                        
                        await database.close();
                        console.log('✅ Database chiuso');
                        console.log('✅ Chiusura completata');
                        process.exit(0);
                    } catch (error) {
                        console.error('❌ Errore chiusura database:', error.message);
                        process.exit(1);
                    }
                });
            }
        };

        // Gestione segnali di chiusura
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        // Gestione errori non gestiti
        process.on('uncaughtException', (error) => {
            console.error('❌ Errore non gestito:', error.message);
            gracefulShutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Promise rifiutata non gestita:', reason);
            gracefulShutdown('unhandledRejection');
        });
    }

    /**
     * Ottiene l'istanza dell'app Express
     */
    getApp() {
        return this.app;
    }

    /**
     * Ottiene l'istanza del server
     */
    getServer() {
        return this.server;
    }
}

// Creazione e avvio del server
const bibliotecaSecureServer = new BibliotecaSecureServer();

// Avvio del server solo se il file viene eseguito direttamente
if (require.main === module) {
    bibliotecaSecureServer.start().catch((error) => {
        console.error('❌ Errore critico:', error.message);
        process.exit(1);
    });
}

module.exports = bibliotecaSecureServer;
