# Biblioteca API Secure - Versione Strutturata

API REST per la gestione di una biblioteca con autenticazione JWT, implementata con architettura modulare seguendo le best practices di Node.js/Express.

## 🏗️ Architettura del Progetto

```
biblioteca-api-secure-strutturata/
├── src/
│   ├── config/
│   │   ├── config.js          # Configurazione centralizzata con JWT
│   │   └── database.js         # Gestione database SQLite con tabelle auth
│   ├── auth/
│   │   └── authService.js      # Servizio di autenticazione JWT
│   ├── models/
│   │   ├── Libro.js           # Modello Libro con validazione
│   │   ├── Utente.js          # Modello Utente con autenticazione
│   │   └── Prestito.js        # Modello Prestito con logica business
│   ├── controllers/
│   │   ├── authController.js     # Controller per autenticazione
│   │   ├── libriController.js    # Controller CRUD per libri
│   │   ├── utentiController.js   # Controller CRUD per utenti
│   │   └── prestitiController.js # Controller CRUD per prestiti
│   ├── routes/
│   │   ├── mainRoutes.js      # Route principali e health check
│   │   ├── authRoutes.js      # Route per autenticazione
│   │   ├── libriRoutes.js     # Route per libri (protette)
│   │   ├── utentiRoutes.js    # Route per utenti (protette)
│   │   └── prestitiRoutes.js  # Route per prestiti (protette)
│   ├── middleware/
│   │   ├── auth.js            # Middleware di autenticazione e autorizzazione
│   │   ├── logging.js         # Middleware di logging
│   │   ├── errorHandler.js    # Gestione errori centralizzata
│   │   └── config.js          # Middleware di configurazione
│   └── server.js             # Server principale con architettura modulare
├── tests/                    # Directory per test futuri
├── package.json
└── README.md
```

## 🚀 Installazione e Avvio

### Prerequisiti
- Node.js (versione 16+)
- npm (Node Package Manager)

### Setup
```bash
# Clona o naviga nella directory del progetto
cd biblioteca-api-secure-strutturata

# Installa le dipendenze
npm install

# Avvia il server in modalità sviluppo
npm run dev

# Oppure avvia in modalità produzione
npm start
```

## 🔐 Autenticazione e Sicurezza

### Sistema JWT
- **Access Token**: Valido per 24 ore
- **Refresh Token**: Valido per 7 giorni
- **Token Blacklist**: Gestione logout e revoca token
- **Sessioni**: Tracciamento sessioni utente

### Ruoli e Permessi
- **User**: Accesso alle proprie risorse
- **Librarian**: Gestione libri e prestiti
- **Admin**: Accesso completo al sistema

### Sicurezza Implementata
- Password hashing con bcrypt
- Rate limiting per utente
- Headers di sicurezza
- Validazione input rigorosa
- Logging delle azioni sensibili

## 📚 API Endpoints

### Autenticazione (Pubbliche)
- `POST /api/auth/register` - Registrazione nuovo utente
- `POST /api/auth/login` - Login utente
- `POST /api/auth/refresh` - Refresh del token
- `POST /api/auth/logout` - Logout utente
- `POST /api/auth/logout-all` - Logout da tutti i dispositivi

### Informazioni Utente (Protette)
- `GET /api/auth/me` - Informazioni utente corrente
- `GET /api/auth/sessions` - Sessioni attive dell'utente

### Libri (Protette)
- `GET /api/libri` - Lista libri (con paginazione e ricerca)
- `GET /api/libri/:id` - Dettaglio libro
- `POST /api/libri` - Crea nuovo libro (Admin/Librarian)
- `PUT /api/libri/:id` - Aggiorna libro (Admin/Librarian)
- `DELETE /api/libri/:id` - Elimina libro (Admin/Librarian)

### Utenti (Protette)
- `GET /api/utenti` - Lista utenti (Admin)
- `GET /api/utenti/:id` - Dettaglio utente (proprio o Admin)
- `PUT /api/utenti/:id` - Aggiorna utente (proprio o Admin)
- `DELETE /api/utenti/:id` - Elimina utente (Admin)

### Prestiti (Protette)
- `GET /api/prestiti` - Lista prestiti (propri o Admin/Librarian)
- `GET /api/prestiti/:id` - Dettaglio prestito
- `POST /api/prestiti` - Crea nuovo prestito
- `PUT /api/prestiti/:id/restituisci` - Restituisce prestito
- `GET /api/prestiti/stats` - Statistiche prestiti

## 🧪 Test dell'API

### Registrazione e Login
```bash
# Registrazione nuovo utente
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario.rossi@email.com",
    "password": "password123",
    "telefono": "333-1234567",
    "indirizzo": "Via Roma 1, Milano"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.rossi@email.com",
    "password": "password123"
  }'
```

### Utilizzo Token
```bash
# Salva il token dalla risposta di login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Accedi a risorse protette
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/libri

# Informazioni utente corrente
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/auth/me
```

### Test Admin
```bash
# Login come admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@biblioteca.com",
    "password": "admin123"
  }'

# Crea nuovo libro (solo admin/librarian)
curl -X POST http://localhost:3001/api/libri \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titolo": "Nuovo Libro",
    "autore": "Autore",
    "isbn": "1234567890",
    "anno_pubblicazione": 2023,
    "genere": "Fantasy"
  }'
```

## 🔧 Caratteristiche Tecniche

### Architettura Modulare
- **Separazione delle responsabilità**: Ogni componente ha un ruolo specifico
- **Servizi di autenticazione**: Gestione JWT centralizzata
- **Middleware di sicurezza**: Autenticazione e autorizzazione
- **Modelli estesi**: Supporto per autenticazione e ruoli

### Sicurezza Avanzata
- **JWT con blacklist**: Revoca token al logout
- **Sessioni tracciate**: Monitoraggio accessi utente
- **Rate limiting**: Protezione da abusi
- **Validazione rigorosa**: Input sanitization
- **Logging sicurezza**: Tracciamento azioni sensibili

### Database Esteso
- **Tabelle di autenticazione**: Utenti con password hash
- **Gestione sessioni**: Tracciamento login/logout
- **Token blacklist**: Revoca token
- **Ruoli e permessi**: Sistema di autorizzazione

## 🔄 Differenze dalla Versione Simple

| Aspetto | Simple | Secure |
|---------|--------|--------|
| **Autenticazione** | Nessuna | JWT completo |
| **Autorizzazione** | Nessuna | Ruoli e permessi |
| **Sicurezza** | Base | Avanzata |
| **Sessioni** | Nessuna | Gestite |
| **Rate Limiting** | Nessuno | Per utente |
| **Logging** | Base | Sicurezza |

## 📝 Note per gli Sviluppatori

### Aggiungere Nuove Funzionalità
1. Crea il modello in `src/models/`
2. Implementa il controller in `src/controllers/`
3. Definisci le route in `src/routes/`
4. Aggiungi middleware di autenticazione se necessario
5. Registra le route in `src/server.js`

### Configurazione Sicurezza
Tutte le configurazioni di sicurezza sono centralizzate in `src/config/config.js`:
- JWT secret e scadenze
- Configurazione bcrypt
- Rate limiting
- CORS e headers di sicurezza

### Gestione Errori
Il sistema di gestione errori è esteso per:
- Errori di autenticazione
- Errori di autorizzazione
- Errori di validazione JWT
- Logging delle azioni sensibili

## 🚀 Prossimi Sviluppi

- [ ] Test unitari e di integrazione
- [ ] Documentazione API con Swagger
- [ ] Email verification
- [ ] Password reset
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth2 integration
- [ ] Audit logging completo
- [ ] Docker containerization
- [ ] CI/CD pipeline
