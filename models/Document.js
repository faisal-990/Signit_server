const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  status: { type: String, enum: ['pending', 'signed', 'rejected'], default: 'pending' },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true })

module.exports = mongoose.model('Document', documentSchema) 