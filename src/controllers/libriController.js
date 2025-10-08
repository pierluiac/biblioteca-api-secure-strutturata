const Libro = require('../models/Libro');

exports.getAllLibri = async (req, res, next) => {
    try {
        const { limit, offset, sortBy, sortOrder } = req.query;
        const libri = await Libro.findAll({ 
            limit: limit ? parseInt(limit) : 50, 
            offset: offset ? parseInt(offset) : 0, 
            sortBy, 
            sortOrder 
        });
        res.status(200).json({ 
            success: true, 
            data: libri, 
            count: libri.length, 
            limit: limit ? parseInt(limit) : 50, 
            offset: offset ? parseInt(offset) : 0 
        });
    } catch (error) {
        next(error);
    }
};

exports.getLibroById = async (req, res, next) => {
    try {
        const libro = await Libro.findById(req.params.id);
        if (!libro) {
            return res.status(404).json({ success: false, error: { message: 'Libro non trovato', status: 404 } });
        }
        res.status(200).json({ success: true, data: libro });
    } catch (error) {
        next(error);
    }
};

exports.createLibro = async (req, res, next) => {
    try {
        const newLibro = new Libro(req.body);
        const savedLibro = await newLibro.save();
        res.status(201).json({ success: true, data: savedLibro, message: 'Libro creato con successo' });
    } catch (error) {
        next(error);
    }
};

exports.updateLibro = async (req, res, next) => {
    try {
        const existingLibro = await Libro.findById(req.params.id);
        if (!existingLibro) {
            return res.status(404).json({ success: false, error: { message: 'Libro non trovato', status: 404 } });
        }
        const updatedLibro = new Libro({ ...existingLibro, ...req.body, id: req.params.id });
        const savedLibro = await updatedLibro.save();
        res.status(200).json({ success: true, data: savedLibro, message: 'Libro aggiornato con successo' });
    } catch (error) {
        next(error);
    }
};

exports.deleteLibro = async (req, res, next) => {
    try {
        const changes = await Libro.delete(req.params.id);
        if (changes === 0) {
            return res.status(404).json({ success: false, error: { message: 'Libro non trovato', status: 404 } });
        }
        res.status(200).json({ success: true, message: 'Libro eliminato con successo' });
    } catch (error) {
        next(error);
    }
};
