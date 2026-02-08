#!/bin/bash

echo "Testing backend signin endpoint..."
echo ""
echo "Test 1: Check if backend is responding"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST http://localhost:5100/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

echo ""
echo "Test 2: Check if server root endpoint works"
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:5100/
