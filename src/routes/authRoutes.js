/**
 * Routes Autenticazione
 * Definisce le rotte per l'autenticazione e gestione utenti
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken, authorize, logSensitiveAction } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Registrazione nuovo utente
 * @access  Public
 * @body    nome, cognome, email, password, telefono, indirizzo
 */
router.post('/register', AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login utente
 * @access  Public
 * @body    email, password
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh del token di accesso
 * @access  Public
 * @body    refreshToken
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout utente
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout da tutti i dispositivi
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/logout-all', authenticateToken, AuthController.logoutAll);

/**
 * @route   GET /api/auth/me
 * @desc    Informazioni utente corrente
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/me', authenticateToken, AuthController.getMe);

/**
 * @route   GET /api/auth/sessions
 * @desc    Sessioni attive dell'utente
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/sessions', authenticateToken, AuthController.getSessions);

module.exports = router;
