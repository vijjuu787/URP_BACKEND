# Resume Upload API Documentation

## Overview
Upload and manage user resumes during signup or update later.

## Features
✅ Direct file upload from user device  
✅ Document validation (PDF, DOC, DOCX)  
✅ File size limit (5MB max)  
✅ Automatic file naming with timestamp  
✅ Static file serving via `/uploads/resumes` endpoint  
✅ Authenticated upload (requires user login)  

## Endpoints

### POST `/api/users/upload-resume`
**Description:** Upload a resume file for the authenticated user

**Authentication:** Required (Bearer token or cookie)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `resume` (file, required) - Resume file from user's device

**Allowed File Formats:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)

**Max File Size:** 5MB

**Response (200 OK):**
```json
{
  "message": "Resume uploaded successfully",
  "resumeUrl": "/uploads/resumes/1707392564123-user-uuid-resume.pdf",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "candidate",
    "resumeUrl": "/uploads/resumes/1707392564123-user-uuid-resume.pdf",
    "resumeFileName": "resume.pdf",
    "resumeUploadedAt": "2026-02-08T12:30:00Z"
  }
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch("http://localhost:5100/api/users/upload-resume", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    credentials: "include",
    body: formData
  });

  const data = await response.json();
  if (response.ok) {
    console.log("Resume uploaded:", data.resumeUrl);
  } else {
    console.error("Upload failed:", data.error);
  }
};

// In HTML form
const fileInput = document.getElementById("resume");
fileInput.addEventListener("change", (e) => {
  uploadResume(e.target.files[0]);
});
```

### React Example
```javascript
import { useState, useContext } from "react";
import { AuthContext } from "./context/AuthContext";

function ResumeUpload() {
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Validate file type
    const allowedTypes = ["application/pdf", "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
      setError("Only PDF, DOC, and DOCX files are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("/api/users/upload-resume", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Resume uploaded successfully!");
        setFile(null);
        console.log("Resume URL:", data.resumeUrl);
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
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      {file && <p>Selected: {file.name}</p>}
      <button onClick={handleUpload} disabled={loading || !file}>
        {loading ? "Uploading..." : "Upload Resume"}
      </button>
    </div>
  );
}

export default ResumeUpload;
```

### Axios Example
```javascript
import axios from "axios";

const uploadResume = async (file, token) => {
  const formData = new FormData();
  formData.append("resume", file);

  try {
    const response = await axios.post(
      "http://localhost:5100/api/users/upload-resume",
      formData,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
        withCredentials: true
      }
    );

    console.log("Upload successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Upload failed:", error.response?.data?.error);
    throw error;
  }
};
```

## Signup with Resume Upload

When signing up, include the resumeUrl from an earlier upload:

```javascript
// 1. First, upload the resume
const uploadResponse = await uploadResume(resumeFile, token);
const resumeUrl = uploadResponse.resumeUrl;

// 2. Then, pass it to signup
const signupResponse = await fetch("/api/users/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: "John Doe",
    email: "john@example.com",
    password: "secure_password",
    role: "candidate",
    resumeUrl: resumeUrl // Include the uploaded resume URL
  })
});
```

## Accessing Uploaded Resumes

Once uploaded, resumes are accessible via:

```
http://localhost:5100/uploads/resumes/1707392564123-user-uuid-resume.pdf
```

Or in your app:
```javascript
// From user data
const resumeUrl = user.resumeUrl;
// Use in link
<a href={resumeUrl} target="_blank" rel="noopener noreferrer">
  Download Resume
</a>
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
  "error": "Only PDF, DOC, and DOCX files are allowed"
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

- **Location:** `/uploads/resumes/` directory on the server
- **Naming:** `timestamp-userid-originalfilename`
- **URL Path:** `/uploads/resumes/filename`
- **Max Size:** 5MB per file
- **Allowed Formats:** PDF, DOC, DOCX

## Security Considerations

✅ File type validation (MIME type + extension check)  
✅ File size limits (5MB max)  
✅ Authentication required  
✅ User-specific file naming  
✅ Static file serving from designated directory  

## Testing with cURL

```bash
curl -X POST http://localhost:5100/api/users/upload-resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

## Integration with User Profile

The resume URL is automatically stored in the User model:
- `resumeUrl` - URL path to the uploaded resume
- `resumeFileName` - Original filename of the resume
- `resumeUploadedAt` - Timestamp of when the resume was uploaded

These fields are included in the `/me` endpoint when authenticated.

## Notes

- Files are stored on the server disk in `/uploads/resumes/` directory
- For production, consider using cloud storage (S3, Cloudinary, etc.)
- Delete old resumes manually or implement cleanup logic
- Resumes are publicly accessible via `/uploads/resumes` endpoint
- Consider adding resume parsing/parsing library for future enhancements

## Workflow Example

```
1. User starts signup process
   ↓
2. User selects resume file (optional)
   ↓
3. Frontend uploads to POST /api/users/upload-resume (requires temp token)
   ↓
4. Server returns resumeUrl: "/uploads/resumes/..."
   ↓
5. Frontend passes resumeUrl in signup POST /api/users/signup
   ↓
6. User account created with resumeUrl stored in database
   ↓
7. Resume accessible at /uploads/resumes/filename
```
