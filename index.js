const express = require('express')
const cors = require('cors')
const passport = require('passport')
require('dotenv').config()
console.log('Loaded CLIENT_URL:', process.env.CLIENT_URL)
const connectDB = require('./utils/db')

require('./utils/passport')

const app = express()
app.set('trust proxy', 1); // Trust the first proxy (Render/Cloudflare)
const PORT = process.env.PORT || 5000

connectDB()

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use('/uploads', express.static('uploads'))

app.use(passport.initialize())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/docs', require('./routes/docs'))
app.use('/api/signatures', require('./routes/signatures'))
app.use('/api/audit', require('./routes/audit'))
app.use('/api/signature-request', require('./routes/signatureRequest'))

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 