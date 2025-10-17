const db = require('../config/database');

class Libro {
    constructor({ id, titolo, autore, isbn, anno_pubblicazione, genere, disponibile, created_at, updated_at }) {
        this.id = id;
        this.titolo = titolo;
        this.autore = autore;
        this.isbn = isbn;
        this.anno_pubblicazione = anno_pubblicazione;
        this.genere = genere;
        this.disponibile = disponibile === 1 || disponibile === true;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    validate() {
        const errors = [];
        if (!this.titolo || this.titolo.trim() === '') {
            errors.push('Il titolo è obbligatorio');
        }
        if (!this.autore || this.autore.trim() === '') {
            errors.push('L\'autore è obbligatorio');
        }
        // ISBN è ora opzionale, ma se presente deve essere valido
        if (this.isbn && this.isbn.trim() !== '') {
            if (!/^\d{9}[\dX]$/.test(this.isbn.replace(/[- ]/g, '')) && !/^(978|979)-\d{1,5}-\d{1,7}-\d{1,6}-[\dX]$/.test(this.isbn)) {
                errors.push('Il formato ISBN non è valido');
            }
        }
        if (this.anno_pubblicazione && (isNaN(this.anno_pubblicazione) || this.anno_pubblicazione < 0 || this.anno_pubblicazione > new Date().getFullYear())) {
            errors.push('L\'anno di pubblicazione non è valido');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static async findAll({ limit = 50, offset = 0, sortBy = 'id', sortOrder = 'ASC' }) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            const query = `SELECT * FROM libri ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
            db.all(query, [limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => new Libro(row)));
                }
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM libri WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    resolve(new Libro(row));
                } else {
                    resolve(null);
                }
            });
        });
    }

    async save() {
        const { isValid, errors } = this.validate();
        if (!isValid) {
            throw new Error(JSON.stringify({ status: 400, message: 'Dati di validazione non validi', details: errors }));
        }

        return new Promise((resolve, reject) => {
            if (this.id) {
                // Update
                const query = `UPDATE libri SET titolo = ?, autore = ?, isbn = ?, anno_pubblicazione = ?, genere = ?, disponibile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
                db.run(query, [this.titolo, this.autore, this.isbn, this.anno_pubblicazione, this.genere, this.disponibile ? 1 : 0, this.id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...this });
                    }
                });
            } else {
                // Insert
                const query = `INSERT INTO libri (titolo, autore, isbn, anno_pubblicazione, genere, disponibile) VALUES (?, ?, ?, ?, ?, ?)`;
                db.run(query, [this.titolo, this.autore, this.isbn, this.anno_pubblicazione, this.genere, this.disponibile ? 1 : 0], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...this });
                    }
                });
            }
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM libri WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }
}

module.exports = Libro;
