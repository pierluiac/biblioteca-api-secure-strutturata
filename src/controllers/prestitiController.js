const Prestito = require('../models/Prestito');

exports.getAllPrestiti = async (req, res, next) => {
    try {
        const { limit, offset, sortBy, sortOrder, search, stato } = req.query;
        const prestiti = await Prestito.findAll({ 
            limit: limit ? parseInt(limit) : 50, 
            offset: offset ? parseInt(offset) : 0, 
            sortBy, 
            sortOrder,
            search: search || '',
            stato: stato || ''
        });
        
        const total = await Prestito.count(stato || '', search || '');
        
        res.status(200).json({ 
            success: true, 
            data: prestiti,
            pagination: {
                total,
                limit: limit ? parseInt(limit) : 50, 
                offset: offset ? parseInt(offset) : 0,
                hasMore: (offset ? parseInt(offset) : 0) + (limit ? parseInt(limit) : 50) < total
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getPrestitoById = async (req, res, next) => {
    try {
        const prestito = await Prestito.findById(req.params.id);
        if (!prestito) {
            return res.status(404).json({ success: false, error: { message: 'Prestito non trovato', status: 404 } });
        }
        res.status(200).json({ success: true, data: prestito });
    } catch (error) {
        next(error);
    }
};

exports.createPrestito = async (req, res, next) => {
    try {
        const newPrestito = new Prestito(req.body);
        const savedPrestito = await newPrestito.save();
        res.status(201).json({ success: true, data: savedPrestito, message: 'Prestito creato con successo' });
    } catch (error) {
        next(error);
    }
};

exports.returnPrestito = async (req, res, next) => {
    try {
        const existingPrestito = await Prestito.findById(req.params.id);
        if (!existingPrestito) {
            return res.status(404).json({ success: false, error: { message: 'Prestito non trovato', status: 404 } });
        }
        const returnedPrestito = await existingPrestito.returnBook();
        res.status(200).json({ success: true, data: returnedPrestito, message: 'Libro restituito con successo' });
    } catch (error) {
        next(error);
    }
};

exports.getPrestitoStats = async (req, res, next) => {
    try {
        const stats = await Prestito.getStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

exports.deletePrestito = async (req, res, next) => {
    try {
        const prestito = await Prestito.findById(req.params.id);
        
        if (!prestito) {
            return res.status(404).json({ success: false, error: { message: 'Prestito non trovato', status: 404 } });
        }
        
        // Controlla se il prestito è stato restituito
        if (prestito.data_restituzione === null) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Impossibile eliminare prestito non restituito. Restituire prima il libro.',
                    status: 400
                }
            });
        }
        
        const changes = await Prestito.delete(req.params.id);
        res.status(200).json({ success: true, message: 'Prestito eliminato con successo' });
    } catch (error) {
        next(error);
    }
};