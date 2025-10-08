const morgan = require('morgan');
const config = require('../config/config');

const logger = morgan((tokens, req, res) => {
    const timestamp = new Date().toISOString();
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const status = tokens.status(req, res);
    const responseTime = tokens['response-time'](req, res);
    const contentLength = tokens.res(req, res, 'content-length');
    
    // Log delle richieste sensibili
    const isSensitiveRequest = url.includes('/auth/') || method === 'POST' || method === 'PUT' || method === 'DELETE';
    
    let logMessage = `${timestamp} ${method} ${url} ${status} ${contentLength || '-'} ${responseTime}ms`;
    
    if (isSensitiveRequest) {
        logMessage += ` [SENSITIVE]`;
    }
    
    // Log dell'utente se autenticato
    if (req.user) {
        logMessage += ` [USER:${req.user.id}:${req.user.ruolo}]`;
    }
    
    return logMessage;
});

module.exports = logger;
