const express = require('express');
const router = express.Router();
const utentiController = require('../controllers/utentiController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Tutte le route degli utenti richiedono autenticazione admin
router.get('/', authenticateToken, authorize('admin'), utentiController.getAllUtenti);
router.get('/:id', authenticateToken, authorize('admin'), utentiController.getUtenteById);
router.post('/', authenticateToken, authorize('admin'), utentiController.createUtente);
router.put('/:id', authenticateToken, authorize('admin'), utentiController.updateUtente);
router.delete('/:id', authenticateToken, authorize('admin'), utentiController.deleteUtente);

module.exports = router;
