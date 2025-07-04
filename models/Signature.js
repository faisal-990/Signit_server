const mongoose = require('mongoose')

const signatureSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  x: Number,
  y: Number,
  page: Number,
  style: { type: String, default: 'draw' },
  name: String,
  status: { type: String, enum: ['pending', 'signed', 'rejected'], default: 'pending' },
}, { timestamps: true })

module.exports = mongoose.model('Signature', signatureSchema) 