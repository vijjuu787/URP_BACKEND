# Frontend Authentication Implementation Guide

## Problem: Logout on Page Refresh

The backend is correctly configured to return JWT tokens and set HTTP-only cookies. However, the **frontend is not persisting the token**, so on page refresh, the stored token is lost.

## Solution: Store Token in localStorage

### Step 1: Store Token After Login

When your login/signup API call succeeds, **save the token to localStorage**:

```javascript
// After successful login
const response = await fetch("https://your-backend.com/api/users/signin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Send cookies
  body: JSON.stringify({ email, password }),
});

const data = await response.json();

if (data.token) {
  // ✅ STORE TOKEN IN LOCALSTORAGE
  localStorage.setItem("token", data.token);
  // ✅ REDIRECT TO DASHBOARD
  navigate("/dashboard");
}
```

### Step 2: Send Token on Every API Request

Update your API client to include the Authorization header:

```javascript
// Create a custom fetch wrapper or axios interceptor
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`; // ✅ INCLUDE TOKEN
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // ✅ INCLUDE COOKIES AS FALLBACK
  });

  return response.json();
};

// Usage:
const profile = await apiCall("https://your-backend.com/api/profile");
```

### Step 3: Check Auth on Page Load

On app initialization (e.g., in useEffect or App.js), check if user is authenticated:

```javascript
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Not logged in
      navigate("/login");
      return;
    }

    try {
      // ✅ VERIFY TOKEN IS STILL VALID
      const response = await fetch("https://your-backend.com/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Token expired or invalid
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      navigate("/login");
    }
  };

  checkAuth();
}, []);
```

### Step 4: Clear Token on Logout

When user clicks logout:

```javascript
const handleLogout = async () => {
  await fetch("https://your-backend.com/api/users/logout", {
    method: "POST",
    credentials: "include",
  });

  // ✅ REMOVE TOKEN FROM STORAGE
  localStorage.removeItem("token");
  navigate("/login");
};
```

## Complete Example (React)

```javascript
// authContext.js or useAuth.js
import { createContext, useState, useEffect } from "react";

const API_URL = "https://your-backend.com/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem("token");
      }
    } catch (err) {
      console.error("Token verification failed:", err);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/users/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await fetch(`${API_URL}/users/logout`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## What Backend Provides

✅ **Signin/Signup Endpoints** return:

```json
{
  "token": "eyJhbGc...",
  "user": { "id", "email", "fullName", "role" }
}
```

✅ **GET /api/users/me** - Verify token is valid
✅ **POST /api/users/logout** - Clear cookies
✅ **HTTP-only Cookies** - Set as fallback (automatic)
✅ **Authorization Header Support** - Primary method

## Key Points

1. **localStorage** persists token across page refresh
2. **Authorization: Bearer {token}** sent with every request
3. **credentials: 'include'** sends cookies as fallback
4. **Check /me on page load** to verify token validity
5. **If 401 response** → token expired → clear localStorage and redirect to login

---

This ensures that:

- ✅ Login persists across page refresh
- ✅ Logout actually logs out (token cleared)
- ✅ Protected routes work on every request
- ✅ Token expiry is handled gracefully
