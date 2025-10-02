/**
 * Main Server Entry Point
 * Sets up Express app, Socket.IO, and all routes
 */
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server: IOServer } = require('socket.io')

// Config & Database
const { getConfig } = require('./config/env')
const { connectDatabase } = require('./config/database')

// Routes
const authRoutes = require('./routes/auth')
const chatRoutes = require('./routes/chat')

// Middleware
const { notFound, errorHandler } = require('./middleware/errorHandler')

// Initialize Express app
const app = express()
const config = getConfig()

// CORS Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`)
        next()
    })
}

// Connect to MongoDB
connectDatabase()
    .then(() => console.log('✓ MongoDB connected'))
    .catch(err => console.error('✗ MongoDB connection failed:', err.message))

// API Routes
app.use('/auth', authRoutes)
app.use('/chat', chatRoutes)

// Root health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Realtime Voice Chat with AI',
        version: '2.0.0',
        uptime: process.uptime()
    })
})

// Detailed health endpoint
app.get('/health', async (req, res) => {
    try {
        const sttService = require('./services/sttService')
        const ttsService = require('./services/ttsService')

        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            services: {
                stt: { available: sttService.isAvailable() },
                tts: { available: ttsService.isAvailable() },
                gpt: { available: Boolean(config.openaiKey) },
                database: { connected: require('mongoose').connection.readyState === 1 }
            }
        })
    } catch (err) {
        res.status(500).json({
            status: 'error',
            uptime: process.uptime(),
            error: err.message
        })
    }
})

// Error handling - must be last
app.use(notFound)
app.use(errorHandler)

// Create HTTP server
const server = http.createServer(app)

// Setup Socket.IO for WebRTC signaling
const io = new IOServer(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    }
})

// Attach socket handlers
try {
    const setupSocketHandlers = require('./controllers/socketController')
    setupSocketHandlers(io)
    console.log('✓ Socket.IO signaling initialized')
} catch (err) {
    console.warn('✗ Could not initialize signaling:', err.message)
}

// Graceful error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
    process.exit(1)
})

// Start server
const PORT = config.port
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🚀 Server running on port ${PORT}       ║
║  📡 Socket.IO enabled                  ║
║  🤖 AI Services configured             ║
╚════════════════════════════════════════╝
    `)
})

module.exports = { app, server, io }
