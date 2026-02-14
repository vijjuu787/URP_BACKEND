#!/bin/bash

# Test script for /api/engineer-assignments/submissions/all/details endpoint

echo "🧪 Testing GET /api/engineer-assignments/submissions/all/details"
echo "---"
echo ""
echo "Step 1: Get a JWT token by signing in"
echo "Run this first to get your token:"
echo ""
echo 'curl -X POST http://localhost:5100/api/users/signin \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"email":"your-email@example.com","password":"your-password"}'"'"
echo ""
echo "Copy the token from the response."
echo ""
echo "Step 2: Test the endpoint with the token"
echo "Replace YOUR_TOKEN with the actual token from step 1:"
echo ""
echo 'curl http://localhost:5100/api/engineer-assignments/submissions/all/details \'
echo '  -H "Authorization: Bearer YOUR_TOKEN"'
echo ""
echo "---"
echo ""
echo "Example full request:"
echo ""
echo 'JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."'
echo 'curl http://localhost:5100/api/engineer-assignments/submissions/all/details \'
echo '  -H "Authorization: Bearer $JWT_TOKEN" \'
echo '  -H "Content-Type: application/json"'
