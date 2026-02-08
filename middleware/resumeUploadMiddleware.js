const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads/resumes directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-userid-originalname
    const uniqueName = `${Date.now()}-${req.user?.id || "unknown"}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter for documents only (PDF, DOC, DOCX)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const allowedExts = [".pdf", ".doc", ".docx"];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedMimes.includes(mime) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, and DOCX files are allowed"), false);
  }
};

// Create multer instance for resume uploads
const uploadResume = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for resumes
  },
});

// Error handling middleware for multer
const handleResumeUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 5MB limit" });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = uploadResume;
module.exports.handleResumeUploadError = handleResumeUploadError;
