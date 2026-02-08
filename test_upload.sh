#!/bin/bash

# Test the upload endpoint
echo "Testing POST /api/profile/upload-picture..."

# First, create a simple test image
# Create a minimal valid PNG (1x1 pixel)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\r\x8d@\x00\x00\x00\x00IEND\xaeB`\x82' > test.png

# Try the endpoint - note this will fail without proper auth
curl -X POST http://localhost:5100/api/profile/upload-picture \
  -F "profileImage=@test.png" \
  -v

echo ""
echo "Note: Request will fail with 401 (Unauthorized) if no valid token"
echo "This is expected - it confirms the endpoint exists and auth middleware is working"

rm test.png
