const db = require('../config/database');
const Libro = require('./Libro');
const Utente = require('./Utente');

class Prestito {
    constructor({ id, libro_id, utente_id, data_prestito, data_scadenza, data_restituzione, scaduto, giorni_ritardo, created_at, updated_at }) {
        this.id = id;
        this.libro_id = libro_id;
        this.utente_id = utente_id;
        this.data_prestito = data_prestito ? new Date(data_prestito) : new Date();
        this.data_scadenza = new Date(data_scadenza);
        this.data_restituzione = data_restituzione ? new Date(data_restituzione) : null;
        this.scaduto = scaduto === 1 || scaduto === true;
        this.giorni_ritardo = giorni_ritardo || 0;
        this.created_at = created_at;
        this.updated_at = updated_at;

        this.updateStatus();
    }

    updateStatus() {
        if (!this.data_restituzione && this.data_scadenza < new Date()) {
            this.scaduto = true;
            this.giorni_ritardo = Math.floor((new Date() - this.data_scadenza) / (1000 * 60 * 60 * 24));
        } else if (this.data_restituzione) {
            this.scaduto = false;
            this.giorni_ritardo = 0;
        }
    }

    validate() {
        const errors = [];
        if (!this.libro_id) {
            errors.push('L\'ID del libro è obbligatorio');
        }
        if (!this.utente_id) {
            errors.push('L\'ID dell\'utente è obbligatorio');
        }

        if (this.libro_id && this.utente_id && parseInt(this.libro_id) === parseInt(this.utente_id)) {
            errors.push('Libro e utente devono essere diversi');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static async findAll({ limit = 50, offset = 0, sortBy = 'id', sortOrder = 'ASC', search = '', stato = '' }) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT p.*, 
                       l.titolo as libro_titolo, l.autore as libro_autore, l.isbn as libro_isbn,
                       u.nome as utente_nome, u.cognome as utente_cognome, u.email as utente_email
                FROM prestiti p
                LEFT JOIN libri l ON p.libro_id = l.id
                LEFT JOIN utenti u ON p.utente_id = u.id
                WHERE 1=1
            `;
            const params = [];

            // Filtro per stato
            if (stato) {
                if (stato === 'attivi') {
                    sql += ' AND p.data_restituzione IS NULL';
                } else if (stato === 'restituiti') {
                    sql += ' AND p.data_restituzione IS NOT NULL';
                } else if (stato === 'scaduti') {
                    sql += ' AND p.data_restituzione IS NULL AND p.data_scadenza < CURRENT_TIMESTAMP';
                }
            }

            // Filtro per ricerca
            if (search) {
                sql += ` AND (
                    l.titolo LIKE ? OR 
                    l.autore LIKE ? OR 
                    u.nome LIKE ? OR 
                    u.cognome LIKE ? OR 
                    u.email LIKE ?
                )`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            }

            sql += ` ORDER BY p.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => new Prestito(row)));
                }
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM prestiti WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    resolve(new Prestito(row));
                } else {
                    resolve(null);
                }
            });
        });
    }

    static async getStats() {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN data_restituzione IS NULL THEN 1 ELSE 0 END) AS attivi,
                    SUM(CASE WHEN data_restituzione IS NOT NULL THEN 1 ELSE 0 END) AS restituiti,
                    SUM(CASE WHEN data_restituzione IS NULL AND data_scadenza < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS scaduti
                FROM prestiti
            `, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    const total = row.total;
                    const scaduti = row.scaduti;
                    const percentuale_scaduti = total > 0 ? (scaduti / total * 100).toFixed(2) : 0;
                    resolve({
                        total: total,
                        attivi: row.attivi,
                        restituiti: row.restituiti,
                        scaduti: scaduti,
                        percentuale_scaduti: parseFloat(percentuale_scaduti)
                    });
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
                const query = `UPDATE prestiti SET libro_id = ?, utente_id = ?, data_prestito = ?, data_scadenza = ?, data_restituzione = ?, scaduto = ?, giorni_ritardo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
                db.run(query, [this.libro_id, this.utente_id, this.data_prestito.toISOString(), this.data_scadenza.toISOString(), this.data_restituzione ? this.data_restituzione.toISOString() : null, this.scaduto ? 1 : 0, this.giorni_ritardo, this.id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...this });
                    }
                });
            } else {
                // Insert
                const query = `INSERT INTO prestiti (libro_id, utente_id, data_prestito, data_scadenza, scaduto, giorni_ritardo) VALUES (?, ?, ?, ?, ?, ?)`;
                db.run(query, [this.libro_id, this.utente_id, this.data_prestito.toISOString(), this.data_scadenza.toISOString(), this.scaduto ? 1 : 0, this.giorni_ritardo], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...this });
                    }
                });
            }
        });
    }

    async returnBook() {
        this.data_restituzione = new Date();
        this.updateStatus(); // Recalculate status and overdue days
        return this.save();
    }

    static async count(stato = '', search = '') {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT COUNT(*) as count
                FROM prestiti p
                LEFT JOIN libri l ON p.libro_id = l.id
                LEFT JOIN utenti u ON p.utente_id = u.id
                WHERE 1=1
            `;
            const params = [];

            // Filtro per stato
            if (stato) {
                if (stato === 'attivi') {
                    sql += ' AND p.data_restituzione IS NULL';
                } else if (stato === 'restituiti') {
                    sql += ' AND p.data_restituzione IS NOT NULL';
                } else if (stato === 'scaduti') {
                    sql += ' AND p.data_restituzione IS NULL AND p.data_scadenza < CURRENT_TIMESTAMP';
                }
            }

            // Filtro per ricerca
            if (search) {
                sql += ` AND (
                    l.titolo LIKE ? OR 
                    l.autore LIKE ? OR 
                    u.nome LIKE ? OR 
                    u.cognome LIKE ? OR 
                    u.email LIKE ?
                )`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            }

            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM prestiti WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }
}

module.exports = Prestito;
