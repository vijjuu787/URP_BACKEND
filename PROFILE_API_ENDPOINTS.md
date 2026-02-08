# Profile API - Complete Endpoints Reference

## Overview

All profile management endpoints with full request/response documentation.

---

## Profile Management Endpoints

### 1. GET Profile (Current User)

**Endpoint:** `GET /api/profile`  
**Auth Required:** ✅ Yes (Bearer token)  
**Description:** Retrieve the authenticated user's profile

**Response (200):**

```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "headline": "Software Engineer",
    "summary": "Experienced full-stack developer",
    "location": "San Francisco",
    "phone": "+1234567890",
    "profileImage": "/uploads/timestamp-userid-filename.jpg",
    "linkedinUrl": "https://linkedin.com/in/username",
    "githubUrl": "https://github.com/username",
    "portfolioUrl": "https://example.com",
    "createdAt": "2026-02-08T10:00:00Z",
    "updatedAt": "2026-02-08T10:05:00Z",
    "experiences": [
      {
        "id": "exp-1",
        "company": "Company Name",
        "role": "Senior Engineer",
        "location": "San Francisco",
        "startDate": "2023-01-01",
        "endDate": null,
        "description": "Description"
      }
    ],
    "educations": [
      {
        "id": "edu-1",
        "degree": "BS Computer Science",
        "institution": "University Name",
        "location": "City",
        "graduationYear": 2020
      }
    ],
    "skills": {
      "id": "skills-uuid",
      "frontend": ["React", "Vue", "HTML/CSS"],
      "backend": ["Node.js", "Python", "PostgreSQL"],
      "tools": ["Git", "Docker", "AWS"]
    },
    "user": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "candidate"
    }
  }
}
```

---

### 2. GET Profile (Any User)

**Endpoint:** `GET /api/profile/:userId`  
**Auth Required:** ❌ No  
**Description:** Retrieve any user's public profile

**Parameters:**

- `userId` (path) - UUID of the user

**Response (200):** Same as GET /api/profile

---

### 3. GET Candidate Profile

**Endpoint:** `GET /api/profile/candidate/:candidateId`  
**Auth Required:** ❌ No  
**Description:** Retrieve a candidate's profile by candidateId

**Parameters:**

- `candidateId` (path) - UUID of the candidate

**Response (200):** Same as GET /api/profile

---

### 4. Create/Update Profile (Full)

**Endpoint:** `POST /api/profile`  
**Auth Required:** ✅ Yes  
**Description:** Create or update entire profile with all details

**Request Body:**

```json
{
  "headline": "Senior Software Engineer",
  "summary": "Experienced full-stack developer...",
  "location": "San Francisco, CA",
  "phone": "+1-555-0123",
  "linkedinUrl": "https://linkedin.com/in/username",
  "githubUrl": "https://github.com/username",
  "portfolioUrl": "https://portfolio.com",
  "experiences": [
    {
      "company": "Tech Company",
      "role": "Senior Engineer",
      "location": "San Francisco",
      "startDate": "2023-01-01",
      "endDate": null,
      "description": "Led development of..."
    }
  ],
  "educations": [
    {
      "degree": "BS Computer Science",
      "institution": "MIT",
      "location": "Cambridge, MA",
      "graduationYear": 2020
    }
  ],
  "skills": {
    "frontend": ["React", "Vue"],
    "backend": ["Node.js", "Python"],
    "tools": ["Git", "Docker"]
  }
}
```

**Response (201):**

```json
{
  "message": "Profile created/updated successfully",
  "data": { ... }
}
```

---

### 5. Update Profile (Partial)

**Endpoint:** `PATCH /api/profile`  
**Auth Required:** ✅ Yes  
**Description:** Update specific profile fields

**Request Body (any combination):**

```json
{
  "headline": "Senior Software Engineer",
  "summary": "Updated summary",
  "location": "New Location",
  "phone": "+1-555-0123"
}
```

**Response (200):**

```json
{
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

## Experience Endpoints

### 6. Add Experience

**Endpoint:** `POST /api/profile/experience`  
**Auth Required:** ✅ Yes  
**Description:** Add a new experience entry

**Request Body:**

```json
{
  "company": "Tech Company",
  "role": "Senior Engineer",
  "location": "San Francisco",
  "startDate": "2023-01-01",
  "endDate": null,
  "description": "Led development of..."
}
```

**Response (201):**

```json
{
  "message": "Experience added successfully",
  "data": {
    "id": "exp-uuid",
    "company": "Tech Company",
    "role": "Senior Engineer",
    "location": "San Francisco",
    "startDate": "2023-01-01",
    "endDate": null,
    "description": "Led development of..."
  }
}
```

---

### 7. Update Experience ✨ NEW

**Endpoint:** `PATCH /api/profile/experience/:experienceId`  
**Auth Required:** ✅ Yes  
**Description:** Update an existing experience

**Parameters:**

- `experienceId` (path) - UUID of the experience to update

**Request Body (any combination):**

```json
{
  "company": "Updated Company",
  "role": "Lead Engineer",
  "location": "New City",
  "startDate": "2022-06-01",
  "endDate": "2023-12-31",
  "description": "Updated description"
}
```

**Response (200):**

```json
{
  "message": "Experience updated successfully",
  "data": { ... }
}
```

---

### 8. Delete Experience

**Endpoint:** `DELETE /api/profile/experience/:experienceId`  
**Auth Required:** ✅ Yes  
**Description:** Delete an experience entry

**Parameters:**

- `experienceId` (path) - UUID of the experience to delete

**Response (200):**

```json
{
  "message": "Experience deleted successfully"
}
```

---

## Education Endpoints

### 9. Add Education

**Endpoint:** `POST /api/profile/education`  
**Auth Required:** ✅ Yes  
**Description:** Add a new education entry

**Request Body:**

```json
{
  "degree": "BS Computer Science",
  "institution": "MIT",
  "location": "Cambridge, MA",
  "graduationYear": 2020
}
```

**Response (201):**

```json
{
  "message": "Education added successfully",
  "data": {
    "id": "edu-uuid",
    "degree": "BS Computer Science",
    "institution": "MIT",
    "location": "Cambridge, MA",
    "graduationYear": 2020
  }
}
```

---

### 10. Update Education ✨ NEW

**Endpoint:** `PATCH /api/profile/education/:educationId`  
**Auth Required:** ✅ Yes  
**Description:** Update an existing education entry

**Parameters:**

- `educationId` (path) - UUID of the education to update

**Request Body (any combination):**

```json
{
  "degree": "MS Computer Science",
  "institution": "Stanford",
  "location": "Stanford, CA",
  "graduationYear": 2022
}
```

**Response (200):**

```json
{
  "message": "Education updated successfully",
  "data": { ... }
}
```

---

### 11. Delete Education

**Endpoint:** `DELETE /api/profile/education/:educationId`  
**Auth Required:** ✅ Yes  
**Description:** Delete an education entry

**Parameters:**

- `educationId` (path) - UUID of the education to delete

**Response (200):**

```json
{
  "message": "Education deleted successfully"
}
```

---

## Skills Endpoints

### 12. Update Skills

**Endpoint:** `POST /api/profile/skills`  
**Auth Required:** ✅ Yes  
**Description:** Update user's skills

**Request Body:**

```json
{
  "frontend": ["React", "Vue", "HTML/CSS"],
  "backend": ["Node.js", "Python", "PostgreSQL"],
  "tools": ["Git", "Docker", "AWS"]
}
```

**Response (201):**

```json
{
  "message": "Skills updated successfully",
  "data": {
    "id": "skills-uuid",
    "profileId": "profile-uuid",
    "frontend": ["React", "Vue", "HTML/CSS"],
    "backend": ["Node.js", "Python", "PostgreSQL"],
    "tools": ["Git", "Docker", "AWS"]
  }
}
```

---

## Social Links Endpoints

### 13. Update LinkedIn URL

**Endpoint:** `PATCH /api/profile/social/linkedin`  
**Auth Required:** ✅ Yes  
**Description:** Add or update LinkedIn profile URL

**Request Body:**

```json
{
  "linkedinUrl": "https://linkedin.com/in/username"
}
```

**Response (200):**

```json
{
  "message": "LinkedIn URL updated successfully",
  "data": {
    "id": "profile-uuid",
    "linkedinUrl": "https://linkedin.com/in/username",
    "githubUrl": "...",
    "portfolioUrl": "..."
  }
}
```

---

### 14. Update GitHub URL

**Endpoint:** `PATCH /api/profile/social/github`  
**Auth Required:** ✅ Yes  
**Description:** Add or update GitHub profile URL

**Request Body:**

```json
{
  "githubUrl": "https://github.com/username"
}
```

**Response (200):** Similar to LinkedIn endpoint

---

### 15. Update Portfolio URL

**Endpoint:** `PATCH /api/profile/social/portfolio`  
**Auth Required:** ✅ Yes  
**Description:** Add or update portfolio website URL

**Request Body:**

```json
{
  "portfolioUrl": "https://portfolio.com"
}
```

**Response (200):** Similar to LinkedIn endpoint

---

### 16. Delete Social Link

**Endpoint:** `DELETE /api/profile/social/:type`  
**Auth Required:** ✅ Yes  
**Description:** Remove a social link

**Parameters:**

- `type` (path) - Must be one of: `linkedin`, `github`, `portfolio`

**Response (200):**

```json
{
  "message": "linkedin link deleted successfully",
  "data": { ... }
}
```

---

## Profile Picture Endpoints

### 17. Upload Profile Picture ✨ NEW

**Endpoint:** `POST /api/profile/upload-picture`  
**Auth Required:** ✅ Yes  
**Content-Type:** `multipart/form-data`  
**Description:** Upload a profile picture from user's device

**Request:**

- Form field: `profileImage` (file, required)
- Allowed types: JPEG, PNG, GIF, WebP
- Max size: 5MB

**Response (200):**

```json
{
  "message": "Profile picture uploaded successfully",
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "profileImage": "/uploads/1707392564123-user-uuid-photo.jpg",
    ...rest of profile data
  }
}
```

**Error Responses:**

```json
// 400 - No file uploaded
{ "error": "No file uploaded" }

// 400 - Invalid file type
{ "error": "Only image files are allowed (JPEG, PNG, GIF, WebP)" }

// 400 - File too large
{ "error": "File size exceeds 5MB limit" }

// 401 - Not authenticated
{ "error": "No authentication token found" }
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Error description"
}
```

### 401 Unauthorized

```json
{
  "error": "No authentication token found. Please log in."
}
```

### 403 Forbidden

```json
{
  "error": "Not authorized to update/delete this resource"
}
```

### 404 Not Found

```json
{
  "error": "Profile not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Error message"
}
```

---

## Testing Examples

### JavaScript/Fetch

**Upload Profile Picture:**

```javascript
const uploadProfilePicture = async (file, token) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  const response = await fetch("/api/profile/upload-picture", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    body: formData,
  });

  return response.json();
};
```

**Update Education:**

```javascript
const updateEducation = async (educationId, data, token) => {
  const response = await fetch(`/api/profile/education/${educationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return response.json();
};
```

**Update Experience:**

```javascript
const updateExperience = async (experienceId, data, token) => {
  const response = await fetch(`/api/profile/experience/${experienceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return response.json();
};
```

---

## Summary

✅ **17 Total Endpoints**

- 5 Profile management endpoints
- 3 Experience endpoints (add, update✨, delete)
- 3 Education endpoints (add, update✨, delete)
- 1 Skills endpoint
- 3 Social links endpoints (LinkedIn, GitHub, Portfolio)
- 1 Social link delete endpoint
- 1 Profile picture upload endpoint✨

✨ = Recently added endpoints that were missing

**All endpoints properly secured with authentication and authorization checks.**
