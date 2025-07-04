const mongoose = require('mongoose')

const signatureRequestSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  recipientEmail: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'signed'], default: 'pending' },
  signedAt: { type: Date },
  signatureData: { type: Object },
}, { timestamps: true })

module.exports = mongoose.model('SignatureRequest', signatureRequestSchema) 