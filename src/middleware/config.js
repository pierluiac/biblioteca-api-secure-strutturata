const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('../config/config');

module.exports = (app) => {
    // Parsing del body delle richieste
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Configurazione CORS sicura
    app.use(cors({
        origin: config.cors.origin,
        methods: config.cors.methods,
        allowedHeaders: config.cors.allowedHeaders,
        credentials: true,
        maxAge: 86400
    }));

    // Header di sicurezza con Helmet
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));

    // Trust proxy per IP reali
    app.set('trust proxy', 1);

    // Header personalizzati per sicurezza
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
};