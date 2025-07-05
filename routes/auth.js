const express = require('express')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const router = express.Router()

// /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// /api/auth/google/callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  const user = req.user
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  // Redirect to frontend with token as query param
  res.redirect(`${process.env.CLIENT_URL}/login/success?token=${token}`)
})

// JWT middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  } else {
    res.sendStatus(401)
  }
}

// Authenticated user info
router.get('/me', authenticateJWT, (req, res) => {
  res.json({ user: req.user })
})

// /api/auth/logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.CLIENT_URL + '/login')
  })
})

module.exports = router 