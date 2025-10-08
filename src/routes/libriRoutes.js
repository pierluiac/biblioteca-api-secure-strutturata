const express = require('express');
const router = express.Router();
const libriController = require('../controllers/libriController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Route pubbliche (non richiedono autenticazione)
router.get('/', libriController.getAllLibri);
router.get('/:id', libriController.getLibroById);

// Route protette (richiedono autenticazione e ruoli specifici)
router.post('/', authenticateToken, authorize('librarian', 'admin'), libriController.createLibro);
router.put('/:id', authenticateToken, authorize('librarian', 'admin'), libriController.updateLibro);
router.delete('/:id', authenticateToken, authorize('admin'), libriController.deleteLibro);

module.exports = router;
