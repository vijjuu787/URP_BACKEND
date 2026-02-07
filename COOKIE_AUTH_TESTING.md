# JWT HTTP-Only Cookie Authentication Testing Guide

## Overview
The authentication system now uses HTTP-only cookies instead of Authorization headers. Cookies are automatically sent with every request when using `credentials: 'include'` in fetch/axios.

## 1. Sign Up (New User)
```bash
curl -X POST http://localhost:5100/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "candidate"
  }' \
  -c cookies.txt
```

Response:
```json
{
  "message": "Signup successful",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "candidate"
  }
}
```

**Note:** The `-c cookies.txt` flag saves the cookie to a file for subsequent requests.

## 2. Sign In (Existing User)
```bash
curl -X POST http://localhost:5100/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

## 3. Get Current User Info (/me endpoint)
```bash
curl -X GET http://localhost:5100/api/users/me \
  -b cookies.txt
```

This returns the authenticated user's data. The `-b cookies.txt` flag sends the stored cookie with the request.

## 4. Get Any User's Profile (Public - No Auth Required)
```bash
curl -X GET http://localhost:5100/api/profile/USER_ID
```

## 5. Get Current User's Profile (Requires Auth)
```bash
curl -X GET http://localhost:5100/api/profile/ \
  -b cookies.txt
```

## 6. Logout (Clear Cookie)
```bash
curl -X POST http://localhost:5100/api/logout \
  -b cookies.txt
```

After logout, the `token` cookie is cleared and subsequent authenticated requests will fail.

## 7. Verify Logout (Should Return 401)
```bash
curl -X GET http://localhost:5100/api/users/me \
  -b cookies.txt
```

## Cookie Properties
- **httpOnly:** true - Cannot be accessed from JavaScript (XSS protection)
- **secure:** true (production only) - Only sent over HTTPS
- **sameSite:** "none" - Allows cross-site requests (needed for frontend on different domain)
- **maxAge:** 7 days (604,800,000 ms)

## Frontend Implementation (JavaScript)

### Sign In with Credentials
```javascript
fetch('http://localhost:5100/api/users/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // IMPORTANT: Sends/receives cookies
  body: JSON.stringify({ email: 'john@example.com', password: 'password123' })
})
.then(res => res.json())
.then(data => console.log(data.user))
```

### Make Authenticated Request
```javascript
fetch('http://localhost:5100/api/users/me', {
  method: 'GET',
  credentials: 'include' // IMPORTANT: Sends cookies
})
.then(res => res.json())
.then(user => console.log(user))
```

### Logout
```javascript
fetch('http://localhost:5100/api/users/logout', {
  method: 'POST',
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log(data.message))
```

## Key Points
1. ✅ Page refresh maintains login (cookie persists)
2. ✅ Cookie automatically sent with authenticated requests
3. ✅ XSS attacks cannot access the cookie (httpOnly)
4. ✅ CSRF protection via sameSite: "none" + Secure flag
5. ✅ Works across different domains (Vercel frontend + Render backend)

## Environment Variables
- `NODE_ENV=production` - Enables secure flag (HTTPS only)
- `JWT_SECRET` - Used to sign/verify tokens
- `PORT=5100` - Server port

## Troubleshooting

### Cookies not being sent
- Make sure to add `credentials: 'include'` in fetch options
- Check CORS configuration allows credentials

### 401 Unauthorized on authenticated endpoints
- Cookie may have expired (check maxAge)
- Browser may have cleared cookies
- Try signing in again

### Cookies not being set
- Check `secure: true` (requires HTTPS in production)
- Check `sameSite: "none"` (allows cross-site cookies)
