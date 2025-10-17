const sqlite3 = require('sqlite3').verbose();
const config = require('./config');
const path = require('path');
const bcrypt = require('bcrypt'); // Per hashare le password iniziali

const dbPath = path.resolve(__dirname, '../../', config.database.filename);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Errore nell\'apertura del database:', err.message);
    } else {
        console.log('✅ Connesso al database SQLite.');
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS libri (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titolo TEXT NOT NULL,
                    autore TEXT NOT NULL,
                    isbn TEXT,
                    anno_pubblicazione INTEGER,
                    genere TEXT,
                    disponibile BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS utenti (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    cognome TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    ruolo TEXT DEFAULT 'user', -- 'user', 'admin', 'librarian'
                    telefono TEXT,
                    indirizzo TEXT,
                    email_verificata BOOLEAN DEFAULT 0,
                    ultimo_accesso DATETIME,
                    login_attempts INTEGER DEFAULT 0,
                    account_bloccato BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS prestiti (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    libro_id INTEGER NOT NULL,
                    utente_id INTEGER NOT NULL,
                    data_prestito DATETIME DEFAULT CURRENT_TIMESTAMP,
                    data_scadenza DATETIME NOT NULL,
                    data_restituzione DATETIME,
                    scaduto BOOLEAN DEFAULT 0,
                    giorni_ritardo INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (libro_id) REFERENCES libri(id),
                    FOREIGN KEY (utente_id) REFERENCES utenti(id)
                );
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS token_blacklist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token_jti TEXT UNIQUE NOT NULL,
                    user_id INTEGER NOT NULL,
                    expires_at DATETIME NOT NULL,
                    blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES utenti(id)
                );
            `);

            // Seed initial data if tables are empty
            db.get("SELECT COUNT(*) as count FROM libri", (err, row) => {
                if (row.count === 0) {
                db.run(`INSERT INTO libri (titolo, autore, isbn, anno_pubblicazione, genere) VALUES
                    ('Il Signore degli Anelli', 'J.R.R. Tolkien', '978-88-04-12345-6', 1954, 'Fantasy'),
                    ('Il Signore degli Anelli', 'J.R.R. Tolkien', '978-88-04-12345-6', 1954, 'Fantasy'),
                    ('1984', 'George Orwell', '978-88-04-12346-3', 1949, 'Distopia'),
                    ('Il Piccolo Principe', 'Antoine de Saint-Exupéry', NULL, 1943, 'Favola'),
                    ('Dune', 'Frank Herbert', '978-88-04-12348-7', 1965, 'Fantascienza'),
                    ('Dune', 'Frank Herbert', '978-88-04-12348-7', 1965, 'Fantascienza'),
                    ('Neuromante', 'William Gibson', NULL, 1984, 'Cyberpunk'),
                    ('Manuale di Programmazione', 'Autore Sconosciuto', NULL, 2020, 'Tecnico');
                `);
                }
            });

            db.get("SELECT COUNT(*) as count FROM utenti", async (err, row) => {
                if (row.count === 0) {
                    const hashedPasswordUser = await bcrypt.hash('password123', config.auth.bcryptRounds);
                    const hashedPasswordAdmin = await bcrypt.hash('admin123', config.auth.bcryptRounds);
                    const hashedPasswordLibrarian = await bcrypt.hash('librarian123', config.auth.bcryptRounds);

                    db.run(`INSERT INTO utenti (nome, cognome, email, password_hash, ruolo, email_verificata) VALUES
                        ('Mario', 'Rossi', 'mario.rossi@example.com', ?, 'user', 1),
                        ('Luisa', 'Bianchi', 'luisa.bianchi@example.com', ?, 'user', 1),
                        ('Admin', 'User', 'admin@biblioteca.com', ?, 'admin', 1),
                        ('Librarian', 'User', 'librarian@biblioteca.com', ?, 'librarian', 1);
                    `, [hashedPasswordUser, hashedPasswordUser, hashedPasswordAdmin, hashedPasswordLibrarian]);
                }
            });
            console.log('✅ Tabelle database inizializzate');
            console.log('✅ Dati di esempio inseriti');
        });
    }
});

module.exports = db;