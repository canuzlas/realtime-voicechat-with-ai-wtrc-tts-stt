/**
 * Error Handling Middleware
 * Centralized error handling for Express app
 */

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message)
        this.name = 'APIError'
        this.statusCode = statusCode
        this.details = details
    }
}

/**
 * Not Found handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function notFound(req, res, next) {
    const error = new APIError(`Route not found: ${req.originalUrl}`, 404)
    next(error)
}

/**
 * Global error handler
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500
    const message = err.message || 'Internal server error'

    // Log error for debugging
    if (statusCode >= 500) {
        console.error('Server error:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method
        })
    } else {
        console.warn('Client error:', {
            message: err.message,
            url: req.originalUrl,
            method: req.method
        })
    }

    // Send error response
    res.status(statusCode).json({
        error: err.name || 'Error',
        message,
        ...(err.details && { details: err.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
}

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 * @param {Function} fn - Async function
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

module.exports = {
    APIError,
    notFound,
    errorHandler,
    asyncHandler
}
