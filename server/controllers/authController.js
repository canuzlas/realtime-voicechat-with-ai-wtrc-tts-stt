/**
 * Auth Controller
 * Handles user registration and login
 */
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { getConfig } = require('../config/env')
const { APIError } = require('../middleware/errorHandler')

/**
 * Register a new user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function register(req, res) {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        throw new APIError('Name, email and password are required', 400)
    }

    if (password.length < 6) {
        throw new APIError('Password must be at least 6 characters', 400)
    }

    const exists = await User.findOne({ email })
    if (exists) {
        throw new APIError('Email already exists', 409)
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hash })

    const config = getConfig()
    const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name },
        config.jwtSecret,
        { expiresIn: '7d' }
    )

    res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    })
}

/**
 * Login user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function login(req, res) {
    const { email, password } = req.body

    if (!email || !password) {
        throw new APIError('Email and password are required', 400)
    }

    const user = await User.findOne({ email })
    if (!user) {
        throw new APIError('Invalid email or password', 401)
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
        throw new APIError('Invalid email or password', 401)
    }

    const config = getConfig()
    const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name },
        config.jwtSecret,
        { expiresIn: '7d' }
    )

    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    })
}

/**
 * Get current user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getMe(req, res) {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
        throw new APIError('User not found', 404)
    }

    res.json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    })
}

module.exports = {
    register,
    login,
    getMe
}
