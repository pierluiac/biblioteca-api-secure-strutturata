const express = require('express');
const http = require('http');
const config = require('./config/config');
const db = require('./config/database'); // Inizializza il database
const applyMiddleware = require('./middleware/config');
const loggingMiddleware = require('./middleware/logging');
const { errorHandler } = require('./middleware/errorHandler');

// Importa le rotte
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');
const libriRoutes = require('./routes/libriRoutes');
const utentiRoutes = require('./routes/utentiRoutes');
const prestitiRoutes = require('./routes/prestitiRoutes');

const app = express();
const server = http.createServer(app);

// Applica middleware globali
applyMiddleware(app);
app.use(loggingMiddleware);

// Rotte API
app.use('/', mainRoutes); // Health check e info API
app.use('/api/auth', authRoutes);
app.use('/api/libri', libriRoutes);
app.use('/api/utenti', utentiRoutes);
app.use('/api/prestiti', prestitiRoutes);

// Gestione delle route non trovate (404)
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route non trovata',
            path: req.originalUrl,
            method: req.method,
            status: 404
        }
    });
});

// Middleware per la gestione centralizzata degli errori
app.use(errorHandler);

// Avvio del server
const PORT = config.server.port;
server.listen(PORT, () => {
    console.log(`🔐 ${config.api.name} in ascolto sulla porta ${PORT} in ambiente ${config.server.environment}`);
    console.log('📚 API disponibili:');
    console.log('   - GET    /health');
    console.log('   - GET    /api');
    console.log('   - POST   /api/auth/register');
    console.log('   - POST   /api/auth/login');
    console.log('   - POST   /api/auth/logout');
    console.log('   - GET    /api/auth/profile');
    console.log('   - GET    /api/libri');
    console.log('   - GET    /api/libri/:id');
    console.log('   - POST   /api/libri (librarian+)');
    console.log('   - PUT    /api/libri/:id (librarian+)');
    console.log('   - DELETE /api/libri/:id (admin)');
    console.log('   - GET    /api/utenti (admin)');
    console.log('   - GET    /api/utenti/:id (admin)');
    console.log('   - POST   /api/utenti (admin)');
    console.log('   - PUT    /api/utenti/:id (admin)');
    console.log('   - DELETE /api/utenti/:id (admin)');
    console.log('   - GET    /api/prestiti (librarian+)');
    console.log('   - GET    /api/prestiti/stats (librarian+)');
    console.log('   - POST   /api/prestiti (librarian+)');
    console.log('   - PUT    /api/prestiti/:id/restituisci (librarian+)');
    console.log('   - DELETE /api/prestiti/:id (admin)');
});

// Gestione della chiusura del server
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
            process.exit(0);
        });
    });
});