const db = require('../config/database');

class Utente {
    constructor({ id, nome, cognome, email, password_hash, ruolo, telefono, indirizzo, email_verificata, ultimo_accesso, login_attempts, account_bloccato, created_at, updated_at }) {
        this.id = id;
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.password_hash = password_hash;
        this.ruolo = ruolo || 'user';
        this.telefono = telefono;
        this.indirizzo = indirizzo;
        this.email_verificata = email_verificata === 1 || email_verificata === true;
        this.ultimo_accesso = ultimo_accesso;
        this.login_attempts = login_attempts || 0;
        this.account_bloccato = account_bloccato === 1 || account_bloccato === true;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    validate() {
        const errors = [];
        if (!this.nome || this.nome.trim() === '') {
            errors.push('Il nome è obbligatorio');
        }
        if (!this.cognome || this.cognome.trim() === '') {
            errors.push('Il cognome è obbligatorio');
        }
        if (!this.email || this.email.trim() === '') {
            errors.push('L\'email è obbligatoria');
        } else if (!/\S+@\S+\.\S+/.test(this.email)) {
            errors.push('Il formato email non è valido');
        }
        if (this.ruolo && !['user', 'admin', 'librarian'].includes(this.ruolo)) {
            errors.push('Il ruolo deve essere user, admin o librarian');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static async findAll({ limit = 50, offset = 0, sortBy = 'id', sortOrder = 'ASC' }) {
        return new Promise((resolve, reject) => {
            const query = `SELECT id, nome, cognome, email, ruolo, telefono, indirizzo, email_verificata, ultimo_accesso, created_at, updated_at FROM utenti ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
            db.all(query, [limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => new Utente(row)));
                }
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT id, nome, cognome, email, ruolo, telefono, indirizzo, email_verificata, ultimo_accesso, created_at, updated_at FROM utenti WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    resolve(new Utente(row));
                } else {
                    resolve(null);
                }
            });
        });
    }

    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM utenti WHERE email = ?', [email], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    resolve(new Utente(row));
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
                const query = `UPDATE utenti SET nome = ?, cognome = ?, email = ?, ruolo = ?, telefono = ?, indirizzo = ?, email_verificata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
                db.run(query, [this.nome, this.cognome, this.email, this.ruolo, this.telefono, this.indirizzo, this.email_verificata ? 1 : 0, this.id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...this });
                    }
                });
            } else {
                // Insert
                const query = `INSERT INTO utenti (nome, cognome, email, password_hash, ruolo, telefono, indirizzo, email_verificata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(query, [this.nome, this.cognome, this.email, this.password_hash, this.ruolo, this.telefono, this.indirizzo, this.email_verificata ? 1 : 0], function(err) {
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
            db.run('DELETE FROM utenti WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }
}

module.exports = Utente;
