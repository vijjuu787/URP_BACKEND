# Profile Routes API Documentation

## Updated Profile Routes with Social Links

### Base URL

```
http://localhost:5100/api/profile
https://urp-backend-1.onrender.com/api/profile
```

---

## 1. GET Current User's Profile

**Endpoint:** `GET /`  
**Authentication:** Required ✅

**Description:** Get the authenticated user's complete profile including experiences, educations, skills, and social links.

**Response:**

```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "headline": "Full Stack Developer",
    "summary": "Passionate developer...",
    "location": "San Francisco, CA",
    "phone": "+1-234-567-8900",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "githubUrl": "https://github.com/johndoe",
    "portfolioUrl": "https://johndoe.com",
    "experiences": [...],
    "educations": [...],
    "skills": {
      "frontend": ["React", "Vue"],
      "backend": ["Node.js", "Python"],
      "tools": ["Git", "Docker"]
    },
    "user": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "candidate"
    },
    "createdAt": "2026-02-08T...",
    "updatedAt": "2026-02-08T..."
  }
}
```

---

## 2. GET Public User Profile

**Endpoint:** `GET /:userId`  
**Authentication:** Not required (public endpoint)

**Description:** Get any user's public profile information.

**Parameters:**

- `userId` (string, path parameter) - User's ID

**Response:** Same as endpoint #1

---

## 3. GET Candidate Profile

**Endpoint:** `GET /candidate/:candidateId`  
**Authentication:** Not required (public endpoint)

**Description:** Get candidate profile by candidate ID.

**Parameters:**

- `candidateId` (string, path parameter) - Candidate's ID

**Response:** Same as endpoint #1

---

## 4. Create/Update User Profile

**Endpoint:** `POST /`  
**Authentication:** Required ✅

**Description:** Create or update complete user profile with all information.

**Request Body:**

```json
{
  "headline": "Full Stack Developer",
  "summary": "Passionate developer with 5+ years experience",
  "location": "San Francisco, CA",
  "phone": "+1-234-567-8900",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "portfolioUrl": "https://johndoe.com",
  "experiences": [
    {
      "company": "Tech Corp",
      "role": "Senior Developer",
      "location": "San Francisco",
      "startDate": "2022-01-01",
      "endDate": "2023-12-31",
      "description": "Led team of 5 developers"
    }
  ],
  "educations": [
    {
      "degree": "Bachelor of Science",
      "institution": "MIT",
      "location": "Cambridge, MA",
      "graduationYear": "2020"
    }
  ],
  "skills": {
    "frontend": ["React", "Vue", "Angular"],
    "backend": ["Node.js", "Python", "Java"],
    "tools": ["Git", "Docker", "Kubernetes"]
  }
}
```

**Response:**

```json
{
  "message": "Profile created/updated successfully",
  "data": { ... }
}
```

---

## 5. Update Profile Fields (Partial)

**Endpoint:** `PATCH /`  
**Authentication:** Required ✅

**Description:** Update specific profile fields without affecting others.

**Request Body:**

```json
{
  "headline": "Senior Full Stack Developer",
  "location": "New York, NY"
}
```

**Response:**

```json
{
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

## 6. Add Experience

**Endpoint:** `POST /experience`  
**Authentication:** Required ✅

**Description:** Add a new work experience to profile.

**Request Body:**

```json
{
  "company": "Tech Corp",
  "role": "Senior Developer",
  "location": "San Francisco",
  "startDate": "2022-01-01",
  "endDate": "2023-12-31",
  "description": "Led team of 5 developers"
}
```

**Response:**

```json
{
  "message": "Experience added successfully",
  "data": {
    "id": "experience-uuid",
    "company": "Tech Corp",
    "role": "Senior Developer",
    ...
  }
}
```

---

## 7. Delete Experience

**Endpoint:** `DELETE /experience/:experienceId`  
**Authentication:** Required ✅

**Description:** Remove a work experience from profile.

**Parameters:**

- `experienceId` (string, path parameter) - Experience ID to delete

**Response:**

```json
{
  "message": "Experience deleted successfully"
}
```

---

## 8. Add Education

**Endpoint:** `POST /education`  
**Authentication:** Required ✅

**Description:** Add educational qualification to profile.

**Request Body:**

```json
{
  "degree": "Bachelor of Science",
  "institution": "MIT",
  "location": "Cambridge, MA",
  "graduationYear": "2020"
}
```

**Response:**

```json
{
  "message": "Education added successfully",
  "data": {
    "id": "education-uuid",
    "degree": "Bachelor of Science",
    ...
  }
}
```

---

## 9. Delete Education

**Endpoint:** `DELETE /education/:educationId`  
**Authentication:** Required ✅

**Description:** Remove an educational qualification from profile.

**Parameters:**

- `educationId` (string, path parameter) - Education ID to delete

**Response:**

```json
{
  "message": "Education deleted successfully"
}
```

---

## 10. Update Skills

**Endpoint:** `POST /skills`  
**Authentication:** Required ✅

**Description:** Update technical skills (frontend, backend, tools).

**Request Body:**

```json
{
  "frontend": ["React", "Vue", "Angular"],
  "backend": ["Node.js", "Python", "Java"],
  "tools": ["Git", "Docker", "Kubernetes"]
}
```

**Response:**

```json
{
  "message": "Skills updated successfully",
  "data": {
    "id": "skills-uuid",
    "frontend": ["React", "Vue", "Angular"],
    "backend": ["Node.js", "Python", "Java"],
    "tools": ["Git", "Docker", "Kubernetes"]
  }
}
```

---

## 11. Update LinkedIn URL ✨ NEW

**Endpoint:** `PATCH /social/linkedin`  
**Authentication:** Required ✅

**Description:** Update LinkedIn profile URL.

**Request Body:**

```json
{
  "linkedinUrl": "https://linkedin.com/in/johndoe"
}
```

**Response:**

```json
{
  "message": "LinkedIn URL updated successfully",
  "data": {
    "id": "profile-uuid",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "githubUrl": "https://github.com/johndoe",
    "portfolioUrl": "https://johndoe.com"
  }
}
```

---

## 12. Update GitHub URL ✨ NEW

**Endpoint:** `PATCH /social/github`  
**Authentication:** Required ✅

**Description:** Update GitHub profile URL.

**Request Body:**

```json
{
  "githubUrl": "https://github.com/johndoe"
}
```

**Response:**

```json
{
  "message": "GitHub URL updated successfully",
  "data": {
    "id": "profile-uuid",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "githubUrl": "https://github.com/johndoe",
    "portfolioUrl": "https://johndoe.com"
  }
}
```

---

## 13. Update Portfolio URL ✨ NEW

**Endpoint:** `PATCH /social/portfolio`  
**Authentication:** Required ✅

**Description:** Update portfolio website URL.

**Request Body:**

```json
{
  "portfolioUrl": "https://johndoe.com"
}
```

**Response:**

```json
{
  "message": "Portfolio URL updated successfully",
  "data": {
    "id": "profile-uuid",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "githubUrl": "https://github.com/johndoe",
    "portfolioUrl": "https://johndoe.com"
  }
}
```

---

## 14. Delete Social Link ✨ NEW

**Endpoint:** `DELETE /social/:type`  
**Authentication:** Required ✅

**Description:** Remove a social link from profile.

**Parameters:**

- `type` (string, path parameter) - Must be one of: `linkedin`, `github`, `portfolio`

**Examples:**

```
DELETE /social/linkedin
DELETE /social/github
DELETE /social/portfolio
```

**Response:**

```json
{
  "message": "linkedin link deleted successfully",
  "data": {
    "id": "profile-uuid",
    "linkedinUrl": null,
    "githubUrl": "https://github.com/johndoe",
    "portfolioUrl": "https://johndoe.com"
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid LinkedIn URL"
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
  "error": "Not authorized to delete this experience"
}
```

### 404 Not Found

```json
{
  "error": "Profile not found for authenticated user"
}
```

### 500 Internal Server Error

```json
{
  "error": "Database error message"
}
```

---

## Example Usage - JavaScript/Fetch

### Get Current User's Profile

```javascript
const response = await fetch("http://localhost:5100/api/profile", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  credentials: "include",
});
const data = await response.json();
console.log(data);
```

### Update Complete Profile

```javascript
const response = await fetch("http://localhost:5100/api/profile", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    headline: "Full Stack Developer",
    summary: "Passionate developer...",
    location: "San Francisco, CA",
    linkedinUrl: "https://linkedin.com/in/johndoe",
    githubUrl: "https://github.com/johndoe",
    portfolioUrl: "https://johndoe.com",
  }),
});
const data = await response.json();
console.log(data);
```

### Update LinkedIn URL

```javascript
const response = await fetch(
  "http://localhost:5100/api/profile/social/linkedin",
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      linkedinUrl: "https://linkedin.com/in/johndoe",
    }),
  },
);
const data = await response.json();
console.log(data);
```

### Add Experience

```javascript
const response = await fetch("http://localhost:5100/api/profile/experience", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    company: "Tech Corp",
    role: "Senior Developer",
    startDate: "2022-01-01",
    endDate: "2023-12-31",
  }),
});
const data = await response.json();
console.log(data);
```

### Update Skills

```javascript
const response = await fetch("http://localhost:5100/api/profile/skills", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    frontend: ["React", "Vue"],
    backend: ["Node.js", "Python"],
    tools: ["Git", "Docker"],
  }),
});
const data = await response.json();
console.log(data);
```

---

## Features

✅ **Complete Profile Management** - Headline, summary, location, phone  
✅ **Social Links** - LinkedIn, GitHub, Portfolio URLs with validation  
✅ **Work Experience** - Add, view, and delete work history  
✅ **Education** - Add, view, and delete educational qualifications  
✅ **Skills** - Frontend, Backend, and Tools categories  
✅ **URL Validation** - All social links are validated  
✅ **Authentication** - Protected endpoints require valid JWT token  
✅ **Public Profiles** - View any user's profile without authentication  
✅ **Automatic Profile Creation** - Profile auto-created on first update

---

## Database Schema

```prisma
model UserProfile {
  id              String          @id @default(uuid())
  userId          String          @unique
  headline        String?
  summary         String?
  location        String?
  phone           String?
  linkedinUrl     String?         // NEW
  githubUrl       String?         // NEW
  portfolioUrl    String?         // NEW
  experiences     Experience[]
  educations      Education[]
  skills          ProfileSkills?
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@map("user_profiles")
}
```

---

## Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success (GET, PATCH, DELETE)         |
| 201  | Created (POST)                       |
| 400  | Bad Request (validation error)       |
| 401  | Unauthorized (invalid/missing token) |
| 403  | Forbidden (not authorized)           |
| 404  | Not Found                            |
| 500  | Internal Server Error                |

---

## What's New ✨

- ✅ `linkedinUrl` field added to UserProfile schema
- ✅ `githubUrl` field added to UserProfile schema
- ✅ `portfolioUrl` field added to UserProfile schema
- ✅ `PATCH /social/linkedin` - Update LinkedIn URL
- ✅ `PATCH /social/github` - Update GitHub URL
- ✅ `PATCH /social/portfolio` - Update Portfolio URL
- ✅ `DELETE /social/:type` - Remove social links
- ✅ URL validation for all social links
- ✅ Can update social links during profile creation (POST /)
- ✅ Can update social links during profile update (PATCH /)

---

## Next Steps

1. ✅ Schema updated with LinkedIn, GitHub, Portfolio URLs
2. ✅ Routes created with full CRUD operations
3. 📋 Run migration: `npx prisma migrate dev --name add_social_links`
4. 📋 Test endpoints using Postman/curl
5. 📋 Integrate with frontend profile forms
6. 📋 Display social links on public profiles
