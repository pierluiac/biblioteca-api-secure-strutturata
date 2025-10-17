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
            // Query principale per statistiche base
            db.get(`
                SELECT
                    COUNT(*) AS totale_prestiti,
                    SUM(CASE WHEN data_restituzione IS NULL THEN 1 ELSE 0 END) AS prestiti_attivi,
                    SUM(CASE WHEN data_restituzione IS NOT NULL THEN 1 ELSE 0 END) AS prestiti_restituiti,
                    SUM(CASE WHEN data_restituzione IS NULL AND data_scadenza < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS prestiti_scaduti
                FROM prestiti
            `, (err, baseStats) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Query per libro più prestato
                db.get(`
                    SELECT 
                        l.titolo,
                        COUNT(*) as conteggio
                    FROM prestiti p
                    LEFT JOIN libri l ON p.libro_id = l.id
                    WHERE l.titolo IS NOT NULL
                    GROUP BY l.titolo
                    ORDER BY conteggio DESC
                    LIMIT 1
                `, (err, libroPiuPrestato) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Query per utente più attivo
                    db.get(`
                        SELECT 
                            u.nome || ' ' || u.cognome as nome_completo,
                            COUNT(*) as conteggio
                        FROM prestiti p
                        LEFT JOIN utenti u ON p.utente_id = u.id
                        WHERE u.nome IS NOT NULL AND u.cognome IS NOT NULL
                        GROUP BY u.nome, u.cognome
                        ORDER BY conteggio DESC
                        LIMIT 1
                    `, (err, utentePiuAttivo) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Query per media giorni prestito
                        db.get(`
                            SELECT 
                                AVG(
                                    CASE 
                                        WHEN data_restituzione IS NOT NULL 
                                        THEN julianday(data_restituzione) - julianday(data_prestito)
                                        ELSE NULL 
                                    END
                                ) as media_giorni_prestito
                            FROM prestiti
                            WHERE data_prestito IS NOT NULL AND data_restituzione IS NOT NULL
                        `, (err, mediaGiorni) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            // Calcola percentuale scaduti
                            const percentualeScaduti = baseStats.totale_prestiti > 0 ? 
                                (baseStats.prestiti_scaduti / baseStats.totale_prestiti * 100).toFixed(2) : 0;

                            resolve({
                                totale_prestiti: baseStats.totale_prestiti,
                                prestiti_attivi: baseStats.prestiti_attivi,
                                prestiti_restituiti: baseStats.prestiti_restituiti,
                                prestiti_scaduti: baseStats.prestiti_scaduti,
                                percentuale_scaduti: parseFloat(percentualeScaduti),
                                libro_piu_prestato: libroPiuPrestato ? {
                                    titolo: libroPiuPrestato.titolo,
                                    conteggio: libroPiuPrestato.conteggio
                                } : null,
                                utente_piu_attivo: utentePiuAttivo ? {
                                    nome_completo: utentePiuAttivo.nome_completo,
                                    conteggio: utentePiuAttivo.conteggio
                                } : null,
                                media_giorni_prestito: mediaGiorni.media_giorni_prestito ? 
                                    Math.round(mediaGiorni.media_giorni_prestito * 10) / 10 : 0
                            });
                        });
                    });
                });
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
