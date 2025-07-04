const express = require('express')
const Document = require('../models/Document')
const User = require('../models/User')
const router = express.Router()

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

// POST /api/docs/upload (metadata after file upload)
router.post('/upload', requireAuth, async (req, res) => {
  const { name, url } = req.body
  if (!name || !url) return res.status(400).json({ error: 'Missing name or url' })
  try {
    const doc = await Document.create({
      owner: req.user._id,
      name,
      url,
      status: 'pending',
    })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: 'Failed to save document' })
  }
})

// GET /api/docs/ (list all docs for user)
router.get('/', requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user._id }).sort({ createdAt: -1 })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

// GET /api/docs/:id (fetch single doc)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch document' })
  }
})

module.exports = router 