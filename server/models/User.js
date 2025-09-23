const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Ensure unique index on email
userSchema.index({ email: 1 }, { unique: true })

module.exports = mongoose.model('User', userSchema)
