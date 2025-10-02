/**
 * Authentication Middleware
 * JWT token verification for protected routes
 */
const jwt = require('jsonwebtoken')
const { getConfig } = require('../config/env')

/**
 * Verify JWT token middleware
 * Adds decoded user data to req.user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function verifyJWT(req, res, next) {
    const auth = req.headers.authorization

    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header'
        })
    }

    const token = auth.split(' ')[1]
    const config = getConfig()

    try {
        const payload = jwt.verify(token, config.jwtSecret)
        req.user = payload
        next()
    } catch (err) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        })
    }
}

/**
 * Optional JWT verification (doesn't fail if no token)
 * Useful for routes that work both with and without auth
 */
function optionalJWT(req, res, next) {
    const auth = req.headers.authorization

    if (!auth || !auth.startsWith('Bearer ')) {
        req.user = null
        return next()
    }

    const token = auth.split(' ')[1]
    const config = getConfig()

    try {
        const payload = jwt.verify(token, config.jwtSecret)
        req.user = payload
    } catch (err) {
        req.user = null
    }

    next()
}

module.exports = verifyJWT
module.exports.verifyJWT = verifyJWT
module.exports.optionalJWT = optionalJWT
