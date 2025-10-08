/**
 * Modulo Database con supporto autenticazione
 * Gestisce la connessione e l'inizializzazione del database SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.resolve(config.database.path);
    }

    /**
     * Inizializza la connessione al database
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Errore connessione database:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Database connesso:', this.dbPath);
                    resolve();
                }
            });
        });
    }

    /**
     * Inizializza le tabelle del database
     */
    async initializeTables() {
        const tables = [
            // Tabella utenti con autenticazione
            `CREATE TABLE IF NOT EXISTS utenti (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cognome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                ruolo TEXT DEFAULT 'user',
                telefono TEXT,
                indirizzo TEXT,
                email_verificata BOOLEAN DEFAULT 0,
                ultimo_accesso DATETIME,
                tentativi_login INTEGER DEFAULT 0,
                account_bloccato BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabella libri
            `CREATE TABLE IF NOT EXISTS libri (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titolo TEXT NOT NULL,
                autore TEXT NOT NULL,
                isbn TEXT UNIQUE NOT NULL,
                anno_pubblicazione INTEGER,
                genere TEXT,
                disponibile BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabella prestiti
            `CREATE TABLE IF NOT EXISTS prestiti (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                libro_id INTEGER NOT NULL,
                utente_id INTEGER NOT NULL,
                data_prestito DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_scadenza DATETIME,
                data_restituzione DATETIME,
                stato TEXT DEFAULT 'attivo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (libro_id) REFERENCES libri (id),
                FOREIGN KEY (utente_id) REFERENCES utenti (id)
            )`,

            // Tabella token blacklist
            `CREATE TABLE IF NOT EXISTS token_blacklist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_jti TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES utenti (id)
            )`,

            // Tabella sessioni
            `CREATE TABLE IF NOT EXISTS sessioni (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_jti TEXT UNIQUE NOT NULL,
                refresh_token TEXT,
                ip_address TEXT,
                user_agent TEXT,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES utenti (id)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        console.log('✅ Tabelle database inizializzate');
    }

    /**
     * Inserisce dati di esempio
     */
    async seedData() {
        const bcrypt = require('bcrypt');
        const config = require('./config');

        // Hash delle password di esempio
        const passwordHash = await bcrypt.hash('password123', config.auth.bcryptRounds);
        const adminPasswordHash = await bcrypt.hash('admin123', config.auth.bcryptRounds);

        const utenti = [
            ['Mario', 'Rossi', 'mario.rossi@email.com', passwordHash, 'user', '333-1234567', 'Via Roma 1, Milano'],
            ['Giulia', 'Bianchi', 'giulia.bianchi@email.com', passwordHash, 'user', '333-2345678', 'Via Milano 2, Roma'],
            ['Luca', 'Verdi', 'luca.verdi@email.com', passwordHash, 'user', '333-3456789', 'Via Napoli 3, Firenze'],
            ['Admin', 'Sistema', 'admin@biblioteca.com', adminPasswordHash, 'admin', '333-0000000', 'Via Admin 1, Roma']
        ];

        const libri = [
            ['Il Signore degli Anelli', 'J.R.R. Tolkien', '978-88-04-12345-6', 1954, 'Fantasy'],
            ['1984', 'George Orwell', '978-88-04-12346-3', 1949, 'Distopia'],
            ['Il Piccolo Principe', 'Antoine de Saint-Exupéry', '978-88-04-12347-0', 1943, 'Favola'],
            ['Dune', 'Frank Herbert', '978-88-04-12348-7', 1965, 'Fantascienza'],
            ['Neuromante', 'William Gibson', '978-88-04-12349-4', 1984, 'Cyberpunk']
        ];

        // Inserimento utenti
        for (const utente of utenti) {
            await this.run(
                `INSERT OR IGNORE INTO utenti (nome, cognome, email, password_hash, ruolo, telefono, indirizzo) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                utente
            );
        }

        // Inserimento libri
        for (const libro of libri) {
            await this.run(
                `INSERT OR IGNORE INTO libri (titolo, autore, isbn, anno_pubblicazione, genere) 
                 VALUES (?, ?, ?, ?, ?)`,
                libro
            );
        }

        console.log('✅ Dati di esempio inseriti');
    }

    /**
     * Esegue una query SQL
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Esegue una query SELECT
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Esegue una query SELECT per più righe
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Chiude la connessione al database
     */
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('✅ Database chiuso');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Singleton pattern per il database
const database = new Database();

module.exports = database;
