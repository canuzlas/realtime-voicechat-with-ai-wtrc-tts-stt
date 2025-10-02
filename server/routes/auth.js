/**
 * Auth Routes
 * Handles user authentication endpoints
 */
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { verifyJWT } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// POST /auth/register
router.post('/register', asyncHandler(authController.register))

// POST /auth/login
router.post('/login', asyncHandler(authController.login))

// GET /auth/me - Get current user (protected)
router.get('/me', verifyJWT, asyncHandler(authController.getMe))

module.exports = router
