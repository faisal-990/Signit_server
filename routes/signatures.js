const express = require('express')
const Signature = require('../models/Signature')
const Document = require('../models/Document')
const Audit = require('../models/Audit')
const router = express.Router()

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

// POST /api/signatures/ (add signature to a document)
router.post('/', requireAuth, async (req, res) => {
  const { document, x, y, page, style, name } = req.body
  if (!document || x == null || y == null || page == null) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  try {
    const signature = await Signature.create({
      document,
      user: req.user._id,
      x,
      y,
      page,
      style,
      name,
      status: 'signed',
    })
    // Update the document status to 'signed'
    await Document.findByIdAndUpdate(document, { status: 'signed' })
    await Audit.create({
      user: req.user._id,
      document,
      action: 'signed',
      details: `Signature placed at (${x}, ${y}) on page ${page}`
    })
    res.json(signature)
  } catch (err) {
    res.status(500).json({ error: 'Failed to save signature' })
  }
})

// GET /api/signatures/:documentId (list all signatures for a document)
router.get('/:documentId', requireAuth, async (req, res) => {
  try {
    const signatures = await Signature.find({ document: req.params.documentId })
    res.json(signatures)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch signatures' })
  }
})

// PATCH /api/signatures/:id (update signature status)
router.patch('/:id', requireAuth, async (req, res) => {
  const { status } = req.body
  try {
    const signature = await Signature.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    if (!signature) return res.status(404).json({ error: 'Signature not found' })
    await Audit.create({
      user: req.user._id,
      document: signature.document,
      action: 'signature_status_updated',
      details: `Signature status updated to ${status}`
    })
    res.json(signature)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update signature' })
  }
})

module.exports = router 