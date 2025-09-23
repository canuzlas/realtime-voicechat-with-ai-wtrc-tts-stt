const io = require('socket.io-client')
const s = io('http://127.0.0.1:3000', { transports: ['polling'], upgrade: false })

s.on('connect', () => { console.log('connected', s.id); s.emit('join', { room: 'test-room' }) })
s.on('disconnect', (r) => { console.log('disconnected', r) })
s.on('connect_error', (e) => { console.error('connect_error', e && (e.message || e)) })
setTimeout(() => { console.log('done'); process.exit(0) }, 3000)
