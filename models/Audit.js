const mongoose = require('mongoose')

const auditSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  action: { type: String, required: true }, // e.g., 'uploaded', 'signed', 'viewed', 'rejected'
  details: { type: String },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Audit', auditSchema) 