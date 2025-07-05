const express = require('express')
const passport = require('passport')
const router = express.Router()

// /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.CLIENT_URL + '/login',
    session: true
  }),
  (req, res) => {
    req.session.save(() => {
      res.redirect(process.env.CLIENT_URL);
    });
  }
)

// /api/auth/me
router.get('/me', (req, res) => {
  if (req.user) {
    res.json({ user: req.user })
  } else {
    res.status(401).json({ user: null })
  }
})

// /api/auth/logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.CLIENT_URL + '/login')
  })
})

module.exports = router 