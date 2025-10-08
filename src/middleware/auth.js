/**
 * Middleware di Autenticazione
 * Gestisce l'autenticazione JWT e l'autorizzazione
 */

const AuthService = require('../auth/authService');
const { asyncHandler } = require('./errorHandler');

/**
 * Middleware per verificare l'autenticazione JWT
 */
const authenticateToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Token di accesso richiesto',
                status: 401
            }
        });
    }

    try {
        // Verifica il token
        const decoded = AuthService.verifyToken(token);
        
        // Verifica se il token è nella blacklist
        if (config.auth.tokenBlacklistEnabled) {
            const isBlacklisted = await AuthService.isTokenBlacklisted(decoded.jti);
            if (isBlacklisted) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Token non valido',
                        status: 401
                    }
                });
            }
        }

        // Aggiungi le informazioni dell'utente alla richiesta
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            ruolo: decoded.ruolo,
            jti: decoded.jti
        };

        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Token non valido o scaduto',
                status: 403
            }
        });
    }
});

/**
 * Middleware per verificare i ruoli
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Autenticazione richiesta',
                    status: 401
                }
            });
        }

        if (!roles.includes(req.user.ruolo)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Permessi insufficienti',
                    status: 403,
                    required: roles,
                    current: req.user.ruolo
                }
            });
        }

        next();
    };
};

/**
 * Middleware per verificare se l'utente può accedere alla risorsa
 */
const authorizeResource = (resourceType) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Autenticazione richiesta',
                    status: 401
                }
            });
        }

        // Admin può accedere a tutto
        if (req.user.ruolo === 'admin') {
            return next();
        }

        // Librarian può gestire libri e prestiti
        if (req.user.ruolo === 'librarian' && ['libri', 'prestiti'].includes(resourceType)) {
            return next();
        }

        // User può accedere solo alle proprie risorse
        if (req.user.ruolo === 'user') {
            const resourceId = req.params.id || req.params.user_id;
            
            if (resourceType === 'utenti' && resourceId && parseInt(resourceId) !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Puoi accedere solo alle tue risorse',
                        status: 403
                    }
                });
            }

            if (resourceType === 'prestiti') {
                // User può vedere solo i propri prestiti
                req.query.user_id = req.user.id;
            }
        }

        next();
    });
};

/**
 * Middleware per rate limiting basato su utente
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Pulisci richieste vecchie
        if (requests.has(userId)) {
            const userRequests = requests.get(userId).filter(time => time > windowStart);
            requests.set(userId, userRequests);
        } else {
            requests.set(userId, []);
        }

        const userRequests = requests.get(userId);

        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: {
                    message: 'Troppe richieste, riprova più tardi',
                    status: 429,
                    retryAfter: Math.ceil(windowMs / 1000)
                }
            });
        }

        userRequests.push(now);
        next();
    };
};

/**
 * Middleware per logging delle azioni sensibili
 */
const logSensitiveAction = (action) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            const timestamp = new Date().toISOString();
            const userId = req.user ? req.user.id : 'anonymous';
            const ip = req.ip || req.connection.remoteAddress;
            
            console.log(`[${timestamp}] SENSITIVE ACTION: ${action} - User: ${userId} - IP: ${ip} - Status: ${res.statusCode}`);
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

/**
 * Middleware per verificare email verificata
 */
const requireVerifiedEmail = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Autenticazione richiesta',
                status: 401
            }
        });
    }

    // Admin e librarian non hanno bisogno di verificare email
    if (['admin', 'librarian'].includes(req.user.ruolo)) {
        return next();
    }

    // Per ora assumiamo che tutti gli utenti abbiano email verificata
    // In un'applicazione reale, verificheresti questo campo dal database
    next();
};

module.exports = {
    authenticateToken,
    authorize,
    authorizeResource,
    rateLimitByUser,
    logSensitiveAction,
    requireVerifiedEmail
};
