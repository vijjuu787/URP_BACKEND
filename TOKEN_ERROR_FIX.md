# Fix for "Cannot read properties of undefined (reading 'token')" Error

## Problem

The error occurs when:

1. Frontend sends login credentials
2. Backend receives request but token extraction fails
3. Code tries to access `something.token` where `something` is `undefined`

## Root Causes

### Cause 1: Token Not in Response Body

**Symptom:** Frontend tries to do `const token = response.token` but it's undefined

**Fix:** Backend signin endpoint must return token in response body

**Current Status:** ✅ FIXED (lines 89-99 in users.routes.js)

```javascript
res.json({
  message: "Login successful",
  token, // ← Token is returned here
  user: { id, email, fullName, role },
});
```

### Cause 2: Frontend Not Storing Token

**Symptom:** Frontend logs in successfully but doesn't save token

**Fix:** Frontend must do:

```javascript
const response = await fetch('/api/users/signin', {...});
const data = await response.json();
localStorage.setItem('token', data.token); // ← MUST DO THIS
```

### Cause 3: Frontend Not Sending Token on Requests

**Symptom:** Token is stored but not sent in Authorization header

**Fix:** Frontend must include on ALL requests:

```javascript
const token = localStorage.getItem("token");
fetch("/api/profile", {
  headers: {
    Authorization: `Bearer ${token}`, // ← MUST INCLUDE THIS
  },
});
```

### Cause 4: Backend Middleware Accessing Wrong Location

**Symptom:** Middleware tries to access `req.body.token` instead of Authorization header

**Current Status:** ✅ FIXED (AuthMiddleware.js lines 10-22)

```javascript
// Correct way:
if (req.headers?.authorization) {
  const parts = req.headers.authorization.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    token = parts[1];
  }
}

// If not in header, check cookies:
if (!token) {
  token = req.cookies?.token;
}
```

### Cause 5: Undefined User Object

**Symptom:** `req.user` is undefined in protected routes

**Fix:** Make sure middleware runs BEFORE accessing `req.user`

**Current Status:** ✅ FIXED (profile.route.js line 7)

```javascript
// Correct way:
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.id; // ← middleware ran first, req.user exists
  // ...
});

// Wrong way (don't do this):
router.get("/", async (req, res) => {
  // NO MIDDLEWARE!
  const userId = req.user?.id; // ← req.user is undefined
});
```

---

## Complete Authentication Flow (Correct)

### Step 1: Signup/Login

**Frontend:**

```javascript
const response = await fetch("http://localhost:5100/api/users/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email, password }),
});

const data = await response.json();
console.log("Token received:", data.token);
localStorage.setItem("token", data.token); // ← STORE TOKEN
```

**Backend (users.routes.js):**

```javascript
router.post("/signin", async (req, res) => {
  // ... verify credentials ...
  const token = signToken(user);

  res.cookie("token", token, {...});  // Set cookie as fallback

  res.json({
    message: "Login successful",
    token,  // ← Return token in body
    user: { id, email, fullName, role }
  });
});
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { "id": "1", "email": "user@example.com" }
}
```

### Step 2: Make Protected Request

**Frontend:**

```javascript
const token = localStorage.getItem("token");

const response = await fetch("http://localhost:5100/api/profile", {
  headers: {
    Authorization: `Bearer ${token}`, // ← SEND TOKEN IN HEADER
  },
  credentials: "include",
});

const data = await response.json();
console.log("Profile:", data);
```

**Backend (profile.route.js):**

```javascript
router.get("/", requireAuth, async (req, res) => {
  // requireAuth middleware already verified token
  const userId = req.user?.id; // ← req.user exists

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  res.json({ data: profile });
});
```

**Middleware (AuthMiddleware.js):**

```javascript
function requireAuth(req, res, next) {
  try {
    let token = null;

    // Extract from Authorization header
    if (req.headers?.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1]; // ← GET TOKEN FROM HEADER
      }
    }

    // Fallback to cookies
    if (!token) {
      token = req.cookies?.token;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ← SET req.user
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
```

### Step 3: Logout

**Frontend:**

```javascript
await fetch("http://localhost:5100/api/users/logout", {
  method: "POST",
  credentials: "include",
});

localStorage.removeItem("token"); // ← CLEAR TOKEN
navigate("/login");
```

**Backend (users.routes.js):**

```javascript
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.json({ message: "Logout successful" });
});
```

---

## Common Mistakes

❌ **Mistake 1:** Accessing token before it's in response

```javascript
// WRONG
const token = response.token; // undefined because backend didn't return it
```

✅ **Fix:**

```javascript
// RIGHT
const response = await fetch(...);
const data = await response.json();
const token = data.token;  // ← token is in response body
```

---

❌ **Mistake 2:** Not sending token in Authorization header

```javascript
// WRONG
const response = await fetch("/api/profile", {
  headers: { "Content-Type": "application/json" },
  // NO Authorization header!
});
```

✅ **Fix:**

```javascript
// RIGHT
const token = localStorage.getItem("token");
const response = await fetch("/api/profile", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

---

❌ **Mistake 3:** Accessing req.user without middleware

```javascript
// WRONG - no middleware!
router.get("/profile", async (req, res) => {
  const userId = req.user?.id; // ← undefined!
});
```

✅ **Fix:**

```javascript
// RIGHT - middleware first!
router.get("/profile", requireAuth, async (req, res) => {
  const userId = req.user?.id; // ← works because middleware ran
});
```

---

❌ **Mistake 4:** Middleware looking in wrong place

```javascript
// WRONG
const token = req.body.token; // ← not in body!
const token = req.user.token; // ← not in user!
```

✅ **Fix:**

```javascript
// RIGHT
const token = req.headers?.authorization?.split(" ")[1]; // ← from header
const token = req.cookies?.token; // ← or from cookies
```

---

## Checklist: Is Everything Correct?

### Backend ✅

- [ ] `users.routes.js` - signin returns `{ token, user }` in response body
- [ ] `users.routes.js` - signin also sets HTTP-only cookie
- [ ] `AuthMiddleware.js` - checks Authorization header first, then cookies
- [ ] `profile.route.js` - GET / has `requireAuth` middleware
- [ ] `server.js` - CORS has `credentials: true`
- [ ] `server.js` - cookie-parser before routes
- [ ] `server.js` - express.json() before routes

### Frontend ✅

- [ ] Login stores token: `localStorage.setItem('token', response.token)`
- [ ] All API requests include: `'Authorization': 'Bearer ' + token`
- [ ] All requests have: `credentials: 'include'`
- [ ] App checks auth on load: `GET /api/users/me` with Authorization header
- [ ] Logout clears token: `localStorage.removeItem('token')`

---

## Testing

### Test 1: Can Backend Receive Request?

```bash
curl -X POST http://localhost:5100/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Expected:** Response with `{ token, user }` or `{ error: "Invalid credentials" }`

### Test 2: Does Token Work on Protected Route?

```bash
TOKEN=$(curl -s -X POST http://localhost:5100/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | jq -r '.token')

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5100/api/profile
```

**Expected:** Profile data (not 401 error)

### Test 3: Does /me Endpoint Work?

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5100/api/users/me
```

**Expected:** User data

---

## Backend Status Summary

| Component        | Status | Details                           |
| ---------------- | ------ | --------------------------------- |
| Signin endpoint  | ✅     | Returns `{ token, user }`         |
| Signup endpoint  | ✅     | Returns `{ token, user }`         |
| AuthMiddleware   | ✅     | Checks header + cookies correctly |
| Profile route    | ✅     | Has requireAuth middleware        |
| /me endpoint     | ✅     | Has requireAuth middleware        |
| /logout endpoint | ✅     | Clears cookies                    |
| CORS config      | ✅     | credentials: true                 |
| Cookie parser    | ✅     | Configured                        |

---

## Next Steps

1. ✅ Backend is correctly configured (no changes needed)
2. Frontend must implement token storage and Authorization header
3. Test full flow end-to-end
4. Monitor logs for any errors

**Backend is ready!** 🚀
