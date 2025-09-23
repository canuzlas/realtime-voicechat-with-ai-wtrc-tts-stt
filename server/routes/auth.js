const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()
const User = require('../models/User')
const bcrypt = require('bcrypt')

// POST /auth/login
// Accepts { email, password } and returns a signed JWT when credentials are valid
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {}

    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    try {
        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).json({ error: 'invalid credentials' })

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return res.status(401).json({ error: 'invalid credentials' })

        const payload = { email: user.email, sub: user._id }
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' })

        res.json({ token })
    } catch (err) {
        console.error('login error:', err && err.message ? err.message : err)
        res.status(500).json({ error: 'login failed' })
    }
})

// POST /auth/register
// Accepts { name, email, password } and creates a new user with hashed password
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body || {}

    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' })

    try {
        const existing = await User.findOne({ email }).exec()
        if (existing) return res.status(409).json({ error: 'email already exists' })

        const saltRounds = 10
        const hashed = await bcrypt.hash(password, saltRounds)

        const user = new User({ name, email, password: hashed })
        await user.save()

        res.json({ ok: true, message: 'user created' })
    } catch (err) {
        console.error('register error:', err && err.message ? err.message : err)
        res.status(400).json({ error: err && err.message ? err.message : 'could not create user' })
    }
})

// Note: a signup route can be implemented to create users using the User model.
// Example (not enabled by default):
// router.post('/signup', async (req, res) => {
//   const { name, email, password } = req.body
//   try {
//     const user = new User({ name, email, password })
//     await user.save()
//     res.json({ ok: true })
//   } catch (err) { res.status(400).json({ error: err.message }) }
// })

module.exports = router
