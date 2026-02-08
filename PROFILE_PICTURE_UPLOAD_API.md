# Profile Picture Upload API

## Overview

Upload and manage user profile pictures directly from their device.

## Features

✅ Direct file upload from user device  
✅ Image validation (JPEG, PNG, GIF, WebP)  
✅ File size limit (5MB max)  
✅ Automatic file naming with timestamp  
✅ Static file serving via `/uploads` endpoint  
✅ Authenticated upload (requires user login)

## Endpoint

### POST `/api/profile/upload-picture`

**Description:** Upload a profile picture for the authenticated user

**Authentication:** Required (Bearer token or cookie)

**Content-Type:** `multipart/form-data`

**Request Body:**

- `profileImage` (file, required) - Image file from user's device

**Allowed Image Formats:**

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**Max File Size:** 5MB

**Response:**

```json
{
  "message": "Profile picture uploaded successfully",
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "headline": "Software Engineer",
    "summary": "...",
    "location": "San Francisco",
    "phone": "+1234567890",
    "profileImage": "/uploads/1707392564123-user-uuid-photo.jpg",
    "linkedinUrl": "https://linkedin.com/in/username",
    "githubUrl": "https://github.com/username",
    "portfolioUrl": "https://example.com",
    "experiences": [...],
    "educations": [...],
    "skills": {...},
    "user": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "candidate"
    },
    "createdAt": "2026-02-08T10:00:00Z",
    "updatedAt": "2026-02-08T10:05:00Z"
  }
}
```

## Usage Examples

### JavaScript/Fetch

```javascript
const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  const response = await fetch(
    "http://localhost:5100/api/profile/upload-picture",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: formData,
    },
  );

  const data = await response.json();
  if (response.ok) {
    console.log("Upload successful:", data);
  } else {
    console.error("Upload failed:", data.error);
  }
};

// In HTML form
const fileInput = document.getElementById("profileImage");
fileInput.addEventListener("change", (e) => {
  uploadProfilePicture(e.target.files[0]);
});
```

### React Example

```javascript
import { useState, useContext } from "react";
import { AuthContext } from "./context/AuthContext";

function ProfilePictureUpload() {
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
      setError("Only JPEG, PNG, GIF, and WebP files are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const response = await fetch("/api/profile/upload-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Profile picture uploaded successfully");
        setFile(null);
        // Update user profile image
        // ... update your profile state/context
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {file && <p>Selected: {file.name}</p>}
      <button onClick={handleUpload} disabled={loading || !file}>
        {loading ? "Uploading..." : "Upload Profile Picture"}
      </button>
    </div>
  );
}

export default ProfilePictureUpload;
```

### Axios Example

```javascript
import axios from "axios";

const uploadProfilePicture = async (file, token) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  try {
    const response = await axios.post(
      "http://localhost:5100/api/profile/upload-picture",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      },
    );

    console.log("Upload successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Upload failed:", error.response?.data?.error);
    throw error;
  }
};
```

## Accessing Uploaded Images

Once uploaded, images are accessible via:

```
http://localhost:5100/uploads/1707392564123-user-uuid-photo.jpg
```

Or in your app:

```javascript
// From profile data
const imageUrl = profile.profileImage;
// Use in img tag
<img src={imageUrl} alt="Profile" />;
```

## Error Responses

### 400 Bad Request - No file uploaded

```json
{
  "error": "No file uploaded"
}
```

### 400 Bad Request - Invalid file type

```json
{
  "error": "Only image files are allowed (JPEG, PNG, GIF, WebP)"
}
```

### 400 Bad Request - File too large

```json
{
  "error": "File size exceeds 5MB limit"
}
```

### 401 Unauthorized

```json
{
  "error": "No authentication token found. Please log in."
}
```

### 500 Internal Server Error

```json
{
  "error": "Error message"
}
```

## File Storage

- **Location:** `/uploads/` directory on the server
- **Naming:** `timestamp-userid-originalfilename`
- **URL Path:** `/uploads/filename`
- **Max Size:** 5MB per file
- **Allowed Formats:** JPEG, PNG, GIF, WebP

## Security Considerations

✅ File type validation (MIME type + extension check)  
✅ File size limits (5MB max)  
✅ Authentication required  
✅ User-specific file naming  
✅ Static file serving from designated directory

## Testing with cURL

```bash
curl -X POST http://localhost:5100/api/profile/upload-picture \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profileImage=@/path/to/image.jpg"
```

## Integration with Profile GET

The profile picture URL is automatically included when retrieving user profile:

```bash
GET /api/profile/me
```

Response includes:

```json
{
  "profileImage": "/uploads/1707392564123-user-uuid-photo.jpg",
  ...
}
```

## Notes

- Files are stored on the server disk in `/uploads` directory
- For production, consider using cloud storage (S3, Cloudinary, etc.)
- Delete old profile pictures manually or implement cleanup logic
- Images are publicly accessible via `/uploads` endpoint
- Consider adding image optimization/compression for production
