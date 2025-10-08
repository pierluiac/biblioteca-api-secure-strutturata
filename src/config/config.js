/**
 * Configurazione dell'applicazione con supporto JWT
 * Centralizza tutte le configurazioni in un unico file
 */

const config = {
    // Configurazione server
    server: {
        port: process.env.PORT || 3001,
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development'
    },

    // Configurazione database
    database: {
        filename: process.env.DB_FILENAME || 'database.db',
        path: process.env.DB_PATH || './database.db'
    },

    // Configurazione API
    api: {
        version: '1.0.0',
        basePath: '/api',
        defaultLimit: 50,
        maxLimit: 100
    },

    // Configurazione JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'biblioteca-super-secret-key-2025',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        algorithm: 'HS256'
    },

    // Configurazione autenticazione
    auth: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        passwordMinLength: 6,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        tokenBlacklistEnabled: true
    },

    // Configurazione ruoli
    roles: {
        USER: 'user',
        ADMIN: 'admin',
        LIBRARIAN: 'librarian'
    },

    // Configurazione CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // Configurazione logging
    logging: {
        level: process.env.LOG_LEVEL || 'combined',
        format: process.env.LOG_FORMAT || 'combined'
    },

    // Configurazione rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minuti
        max: 100, // limite richieste per IP
        message: 'Troppe richieste da questo IP, riprova più tardi'
    }
};

module.exports = config;
