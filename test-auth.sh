#!/bin/bash

echo "=== Testing JWT HTTP-Only Cookie Authentication ==="
echo ""

# Test 1: Signup
echo "1️⃣  Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:5100/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Cookie Test User",
    "email": "cookieauth@example.com",
    "password": "testpass123",
    "role": "candidate"
  }' -c /tmp/auth_cookies.txt)

echo "$SIGNUP_RESPONSE" | jq '.'
echo ""

# Test 2: Get current user with /me endpoint
echo "2️⃣  Testing GET /me with cookie..."
curl -s -X GET http://localhost:5100/api/users/me \
  -b /tmp/auth_cookies.txt | jq '.'
echo ""

# Test 3: Get any user's profile (public)
echo "3️⃣  Testing GET /profile/:userId (public)..."
USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.user.id')
curl -s -X GET http://localhost:5100/api/profile/$USER_ID | jq '.'
echo ""

# Test 4: Logout
echo "4️⃣  Testing Logout..."
curl -s -X POST http://localhost:5100/api/users/logout \
  -b /tmp/auth_cookies.txt | jq '.'
echo ""

# Test 5: Verify logout - should get 401
echo "5️⃣  Testing /me after logout (should be 401)..."
curl -s -X GET http://localhost:5100/api/users/me \
  -b /tmp/auth_cookies.txt | jq '.'
echo ""

echo "=== All Tests Complete ==="
