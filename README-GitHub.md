# Biblioteca API Secure - Strutturata

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-red.svg)](https://jwt.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-lightblue.svg)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

API REST per la gestione di una biblioteca con autenticazione JWT, implementata con architettura modulare seguendo le best practices di Node.js/Express.

## 🔐 Caratteristiche di Sicurezza

- ✅ **Autenticazione JWT**: Token-based authentication
- ✅ **Autorizzazione**: Sistema di ruoli (User, Librarian, Admin)
- ✅ **Password Hashing**: Bcrypt per sicurezza password
- ✅ **Token Blacklist**: Revoca token al logout
- ✅ **Rate Limiting**: Protezione da abusi
- ✅ **Sessioni Tracciate**: Monitoraggio accessi utente
- ✅ **Validazione Rigorosa**: Input sanitization
- ✅ **Logging Sicurezza**: Tracciamento azioni sensibili

## 🚀 Caratteristiche Generali

- ✅ **Architettura Modulare**: Separazione delle responsabilità
- ✅ **CRUD Completo**: Operazioni su libri, utenti e prestiti
- ✅ **Database SQLite**: Con tabelle di autenticazione
- ✅ **Gestione Errori**: Sistema centralizzato
- ✅ **CORS**: Supporto per richieste cross-origin
- ✅ **Health Check**: Monitoraggio stato applicazione

## 📁 Struttura Progetto

```
src/
├── config/          # Configurazione con JWT
├── auth/            # Servizi di autenticazione
├── models/          # Modelli con autenticazione
├── controllers/     # Controller con auth
├── routes/         # Route protette/pubbliche
├── middleware/      # Middleware di sicurezza
└── server.js        # Server con sicurezza
```

## 🛠️ Installazione

```bash
# Clona il repository
git clone https://github.com/pierluiac/biblioteca-api-secure-strutturata.git
cd biblioteca-api-secure-strutturata

# Installa le dipendenze
npm install

# Avvia il server
npm run dev
```

## 🔐 Autenticazione

### Registrazione
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario@example.com",
    "password": "password123",
    "telefono": "333-1234567",
    "indirizzo": "Via Roma 1"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario@example.com",
    "password": "password123"
  }'
```

### Utilizzo Token
```bash
# Salva il token dalla risposta di login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Accedi a risorse protette
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/libri
```

## 📚 API Endpoints

### Autenticazione (Pubbliche)
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente
- `POST /api/auth/logout` - Logout utente
- `GET /api/auth/me` - Informazioni utente corrente

### Libri (Protette)
- `GET /api/libri` - Lista libri
- `GET /api/libri/:id` - Dettaglio libro
- `POST /api/libri` - Crea libro (Admin/Librarian)
- `PUT /api/libri/:id` - Aggiorna libro (Admin/Librarian)
- `DELETE /api/libri/:id` - Elimina libro (Admin/Librarian)

### Utenti (Protette)
- `GET /api/utenti` - Lista utenti (Admin)
- `GET /api/utenti/:id` - Dettaglio utente
- `PUT /api/utenti/:id` - Aggiorna utente
- `DELETE /api/utenti/:id` - Elimina utente (Admin)

### Prestiti (Protette)
- `GET /api/prestiti` - Lista prestiti
- `POST /api/prestiti` - Crea prestito
- `PUT /api/prestiti/:id/restituisci` - Restituisce prestito
- `GET /api/prestiti/stats` - Statistiche prestiti

## 👥 Ruoli e Permessi

### User
- Accesso alle proprie risorse
- Visualizzazione libri disponibili
- Gestione propri prestiti

### Librarian
- Gestione libri (CRUD completo)
- Gestione prestiti
- Visualizzazione statistiche

### Admin
- Accesso completo al sistema
- Gestione utenti
- Tutte le funzionalità Librarian

## 🧪 Test

```bash
# Registrazione
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","cognome":"User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test admin (credenziali predefinite)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@biblioteca.com","password":"admin123"}'
```

## 🔒 Sicurezza

### Configurazione JWT
- **Secret**: Configurabile via environment variables
- **Scadenza**: 24 ore per access token
- **Refresh Token**: 7 giorni
- **Blacklist**: Token revocati al logout

### Rate Limiting
- **Limite**: 100 richieste per utente ogni 15 minuti
- **Scope**: Per endpoint API protetti
- **Response**: 429 Too Many Requests

### Password Security
- **Hashing**: Bcrypt con 12 rounds
- **Lunghezza minima**: 6 caratteri
- **Validazione**: Regex per formato email

## 📖 Documentazione

Per la documentazione completa, consulta il file `README.md` nella directory del progetto.

## 🤝 Contributi

1. Fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 👨‍💻 Autore

**Pier Luigi Iachini** - [@pierluiac](https://github.com/pierluiac)

## 🙏 Ringraziamenti

- Progetto sviluppato per il corso TPSI-5
- Architettura basata su best practices Node.js/Express
- Sicurezza implementata seguendo OWASP guidelines
- Ispirato ai principi SOLID e design patterns
