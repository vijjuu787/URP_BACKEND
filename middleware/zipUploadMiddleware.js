const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads/assignments directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/assignments");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for ZIP files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-assignmentid-originalname
    const uniqueName = `${Date.now()}-${req.user?.id || "unknown"}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter for ZIP files only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["application/zip", "application/x-zip-compressed"];
  const allowedExts = [".zip"];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedMimes.includes(mime) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only ZIP files are allowed"), false);
  }
};

// Create multer instance for ZIP uploads
const uploadZip = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size for ZIP files
  },
});

// Error handling middleware for multer
const handleZipUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 100MB limit" });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = uploadZip;
module.exports.handleZipUploadError = handleZipUploadError;
