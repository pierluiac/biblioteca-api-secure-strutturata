const Utente = require('../models/Utente');

exports.getAllUtenti = async (req, res, next) => {
    try {
        const { limit, offset, sortBy, sortOrder } = req.query;
        const utenti = await Utente.findAll({ 
            limit: limit ? parseInt(limit) : 50, 
            offset: offset ? parseInt(offset) : 0, 
            sortBy, 
            sortOrder 
        });
        res.status(200).json({ 
            success: true, 
            data: utenti, 
            count: utenti.length, 
            limit: limit ? parseInt(limit) : 50, 
            offset: offset ? parseInt(offset) : 0 
        });
    } catch (error) {
        next(error);
    }
};

exports.getUtenteById = async (req, res, next) => {
    try {
        const utente = await Utente.findById(req.params.id);
        if (!utente) {
            return res.status(404).json({ success: false, error: { message: 'Utente non trovato', status: 404 } });
        }
        res.status(200).json({ success: true, data: utente });
    } catch (error) {
        next(error);
    }
};

exports.createUtente = async (req, res, next) => {
    try {
        const newUtente = new Utente(req.body);
        const savedUtente = await newUtente.save();
        res.status(201).json({ success: true, data: savedUtente, message: 'Utente creato con successo' });
    } catch (error) {
        next(error);
    }
};

exports.updateUtente = async (req, res, next) => {
    try {
        const existingUtente = await Utente.findById(req.params.id);
        if (!existingUtente) {
            return res.status(404).json({ success: false, error: { message: 'Utente non trovato', status: 404 } });
        }
        const updatedUtente = new Utente({ ...existingUtente, ...req.body, id: req.params.id });
        const savedUtente = await updatedUtente.save();
        res.status(200).json({ success: true, data: savedUtente, message: 'Utente aggiornato con successo' });
    } catch (error) {
        next(error);
    }
};

exports.deleteUtente = async (req, res, next) => {
    try {
        const changes = await Utente.delete(req.params.id);
        if (changes === 0) {
            return res.status(404).json({ success: false, error: { message: 'Utente non trovato', status: 404 } });
        }
        res.status(200).json({ success: true, message: 'Utente eliminato con successo' });
    } catch (error) {
        next(error);
    }
};
