const express = require('express')
const Audit = require('../models/Audit')
const router = express.Router()

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

// GET /api/audit/:documentId (get audit history for a document)
router.get('/:documentId', requireAuth, async (req, res) => {
  try {
    const auditTrail = await Audit.find({ document: req.params.documentId })
      .populate('user', 'displayName email')
      .sort({ createdAt: 1 })
    res.json(auditTrail)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit trail' })
  }
})

module.exports = router 