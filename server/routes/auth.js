const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()

// POST /auth/login
// Accepts { email, password } and returns a signed JWT when credentials match hardcoded user
router.post('/login', (req, res) => {
    const { email, password } = req.body || {}

    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    // hardcoded user for testing
    const TEST_USER = {
        email: 'test@example.com',
        password: 'password123',
        id: 'user-1'
    }

    if (email !== TEST_USER.email || password !== TEST_USER.password) {
        return res.status(401).json({ error: 'invalid credentials' })
    }

    const payload = { email: TEST_USER.email, sub: TEST_USER.id }
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' })

    res.json({ token })
})

module.exports = router
