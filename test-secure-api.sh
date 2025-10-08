#!/bin/bash

echo "🧪 TEST COMPLETO BIBLIOTECA API SECURE-STRUTTURATA"
echo "=================================================="

# Test 1: Health Check
echo "1️⃣ Test Health Check..."
curl -s http://localhost:3001/health | jq '.status, .service' || echo "❌ Health check failed"

# Test 2: Documentazione API
echo -e "\n2️⃣ Test Documentazione API..."
curl -s http://localhost:3001/api | jq '.name, .version' || echo "❌ API docs failed"

# Test 3: Route Pubbliche Libri
echo -e "\n3️⃣ Test Route Pubbliche Libri..."
curl -s http://localhost:3001/api/libri | jq '.success, .count' || echo "❌ Libri failed"

# Test 4: Login Utente
echo -e "\n4️⃣ Test Login Utente..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mario.rossi@example.com", "password": "password123"}')

echo "$LOGIN_RESPONSE" | jq '.success, .data.user.nome' || echo "❌ Login failed"

# Test 5: Login Admin
echo -e "\n5️⃣ Test Login Admin..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@biblioteca.com", "password": "admin123"}')

echo "$ADMIN_RESPONSE" | jq '.success, .data.user.ruolo' || echo "❌ Admin login failed"

# Test 6: Login Librarian
echo -e "\n6️⃣ Test Login Librarian..."
LIBRARIAN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "librarian@biblioteca.com", "password": "librarian123"}')

echo "$LIBRARIAN_RESPONSE" | jq '.success, .data.user.ruolo' || echo "❌ Librarian login failed"

echo -e "\n✅ TEST COMPLETATI!"
