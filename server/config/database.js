/**
 * Database configuration and connection
 */
const mongoose = require('mongoose')

/**
 * Initialize MongoDB connection
 * @returns {Promise<void>}
 */
async function connectDatabase() {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || null

    if (!MONGODB_URI) {
        console.warn('MONGODB_URI not set — skipping MongoDB connection')
        return
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('✓ Connected to MongoDB')
    } catch (err) {
        console.error('✗ MongoDB connection error:', err?.message || err)
        throw err
    }

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB error:', err)
    })

    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected')
    })
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
async function closeDatabase() {
    await mongoose.connection.close()
    console.log('MongoDB connection closed')
}

module.exports = {
    connectDatabase,
    closeDatabase
}
