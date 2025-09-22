const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })

    const token = auth.split(' ')[1]
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
        req.user = payload
        next()
    } catch (err) {
        return res.status(401).json({ error: 'invalid token' })
    }
}
