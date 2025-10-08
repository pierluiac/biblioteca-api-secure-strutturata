const express = require('express');
const router = express.Router();
const config = require('../config/config');

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'Biblioteca API Secure Strutturata',
        version: config.api.version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.environment,
        memory: {
            used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
        },
        database: {
            status: 'Connected',
            path: config.database.filename
        },
        security: {
            jwt_enabled: true,
            roles: Object.values(config.roles),
            token_blacklist: config.auth.tokenBlacklistEnabled
        }
    });
});

router.get('/api', (req, res) => {
    res.status(200).json({
        name: 'Biblioteca API Secure Strutturata',
        version: config.api.version,
        description: 'API REST per gestione biblioteca con autenticazione JWT',
        security: {
            authentication: 'JWT Bearer Token',
            authorization: 'Role-based (user, librarian, admin)',
            features: ['Token blacklist', 'Rate limiting', 'Password hashing']
        },
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Registrazione nuovo utente',
                'POST /api/auth/login': 'Login utente',
                'POST /api/auth/logout': 'Logout utente (blacklist token)',
                'GET /api/auth/profile': 'Profilo utente corrente',
                'PUT /api/auth/profile': 'Aggiorna profilo utente'
            },
            libri: {
                'GET /api/libri': 'Lista tutti i libri (pubblico)',
                'GET /api/libri/:id': 'Ottieni libro specifico (pubblico)',
                'POST /api/libri': 'Crea nuovo libro (librarian+)',
                'PUT /api/libri/:id': 'Aggiorna libro (librarian+)',
                'DELETE /api/libri/:id': 'Elimina libro (admin)'
            },
            utenti: {
                'GET /api/utenti': 'Lista tutti gli utenti (admin)',
                'GET /api/utenti/:id': 'Ottieni utente specifico (admin)',
                'POST /api/utenti': 'Crea nuovo utente (admin)',
                'PUT /api/utenti/:id': 'Aggiorna utente (admin)',
                'DELETE /api/utenti/:id': 'Elimina utente (admin)'
            },
            prestiti: {
                'GET /api/prestiti': 'Lista tutti i prestiti (librarian+)',
                'GET /api/prestiti/stats': 'Statistiche prestiti (librarian+)',
                'POST /api/prestiti': 'Crea nuovo prestito (librarian+)',
                'PUT /api/prestiti/:id/restituisci': 'Restituisce libro (librarian+)',
                'DELETE /api/prestiti/:id': 'Elimina prestito (admin)'
            }
        },
        examples: {
            login: {
                url: 'POST /api/auth/login',
                body: {
                    email: 'mario.rossi@example.com',
                    password: 'password123'
                }
            },
            protected_request: {
                url: 'GET /api/libri',
                headers: {
                    'Authorization': 'Bearer YOUR_JWT_TOKEN'
                }
            }
        }
    });
});

module.exports = router;
