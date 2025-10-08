const express = require('express');
const router = express.Router();
const prestitiController = require('../controllers/prestitiController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Route specifiche prima delle route generiche
router.get('/stats', authenticateToken, authorize('librarian', 'admin'), prestitiController.getPrestitoStats);

// Route generiche
router.get('/', authenticateToken, authorize('librarian', 'admin'), prestitiController.getAllPrestiti);
router.get('/:id', authenticateToken, authorize('librarian', 'admin'), prestitiController.getPrestitoById);
router.post('/', authenticateToken, authorize('librarian', 'admin'), prestitiController.createPrestito);
router.put('/:id/restituisci', authenticateToken, authorize('librarian', 'admin'), prestitiController.returnPrestito);
router.delete('/:id', authenticateToken, authorize('admin'), prestitiController.deletePrestito);

module.exports = router;
