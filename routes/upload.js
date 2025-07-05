const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true)
  else cb(new Error('Only PDF files are allowed'), false)
}

const upload = multer({ storage, fileFilter })

router.post('/pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const fileUrl = `/uploads/${req.file.filename}`
  res.json({ url: fileUrl, filename: req.file.filename })
  console.log(fileUrl)
})

module.exports = router 