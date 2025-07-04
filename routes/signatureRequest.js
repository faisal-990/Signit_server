const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const SignatureRequest = require('../models/SignatureRequest')
const Document = require('../models/Document')
const nodemailer = require('nodemailer')

// POST /api/signature-request (create and send email)
router.post('/', async (req, res) => {
  const { documentId, recipientEmail } = req.body
  if (!documentId || !recipientEmail) return res.status(400).json({ error: 'Missing documentId or recipientEmail' })
  const token = crypto.randomBytes(32).toString('hex')
  try {
    const doc = await Document.findById(documentId)
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    const request = await SignatureRequest.create({
      document: documentId,
      recipientEmail,
      token,
    })
    // Send email using Gmail
    const link = `${process.env.CLIENT_URL}/sign/${token}`
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipientEmail,
      subject: 'Please sign the document',
      text: `You have been requested to sign a document. Click here: ${link}`,
      html: `<p>You have been requested to sign a document. <a href=\"${link}\">Click here to sign</a></p>`
    })
    res.json({ success: true, request })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create signature request' })
  }
})

// GET /api/signature-request/:token (get request by token)
router.get('/:token', async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({ token: req.params.token }).populate('document')
    if (!request) return res.status(404).json({ error: 'Invalid or expired link' })
    res.json(request)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch signature request' })
  }
})

// POST /api/signature-request/:token/sign (submit signature)
router.post('/:token/sign', async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({ token: req.params.token })
    if (!request) return res.status(404).json({ error: 'Invalid or expired link' })
    request.status = 'signed'
    request.signedAt = new Date()
    request.signatureData = req.body.signatureData
    await request.save()
    // Update the parent document's status to 'signed'
    await Document.findByIdAndUpdate(request.document, { status: 'signed' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to save signature' })
  }
})

module.exports = router 