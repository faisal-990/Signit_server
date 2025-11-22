const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Import File System module
const router = express.Router();

// 1. Define the absolute path to the uploads folder
const uploadDir = path.join(__dirname, "../uploads");

// 2. Check if it exists, if not, create it!
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created 'uploads' directory at:", uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 3. Use the variable we defined above
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

const upload = multer({ storage, fileFilter });

router.post("/pdf", upload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // Return the relative path that the frontend can use to access the file
  // Note: We use the filename to construct the URL, not the full absolute path
  const fileUrl = `/uploads/${req.file.filename}`;

  console.log("File uploaded successfully:", fileUrl);
  res.json({ url: fileUrl, filename: req.file.filename });
});

module.exports = router;

