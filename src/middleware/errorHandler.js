const errorHandler = (err, req, res, next) => {
    console.error('🔴 Errore API:', err.message);
    console.error('📍 Stack trace:', err.stack);

    let statusCode = 500;
    let message = 'Errore interno del server';
    let details = [];

    try {
        const errorData = JSON.parse(err.message);
        if (errorData.status) statusCode = errorData.status;
        if (errorData.message) message = errorData.message;
        if (errorData.details) details = errorData.details;
    } catch (e) {
        // Not a JSON error, use default or specific error types
        if (err.name === 'ValidationError') {
            statusCode = 400;
            message = 'Dati di validazione non validi';
            details = err.errors || [];
        } else if (err.name === 'UnauthorizedError') { // For JWT errors
            statusCode = 401;
            message = 'Non autorizzato';
        } else if (err.name === 'ForbiddenError') { // For role-based access
            statusCode = 403;
            message = 'Accesso negato';
        } else if (err.name === 'CastError') {
            statusCode = 400;
            message = 'Formato ID non valido';
        } else if (err.code === 'SQLITE_CONSTRAINT') {
            statusCode = 409;
            message = 'Violazione vincolo database';
            details = ['Il record potrebbe già esistere o violare una regola di integrità'];
        }
    }

    // Log dell'errore per sicurezza
    const errorLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        status: statusCode,
        message: message,
        user: req.user ? { id: req.user.id, ruolo: req.user.ruolo } : null,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
    };

    console.error('📊 Error Log:', JSON.stringify(errorLog, null, 2));

    res.status(statusCode).json({
        success: false,
        error: {
            message: message,
            status: statusCode,
            details: details,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        }
    });
};

// Helper per gestire funzioni async
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = { errorHandler, asyncHandler };
