const io = require('socket.io-client')
const fs = require('fs')

const SERVER = 'http://127.0.0.1:4000'
const AUDIO = __dirname + '/out/tts_output.mp3' // reuse existing file

async function run() {
    const s = io(SERVER)
    s.on('connect', async () => {
        console.log('connected', s.id)
        // stream file in chunks
        const data = fs.readFileSync(AUDIO)
        const chunkSize = 32 * 1024
        for (let i = 0; i < data.length; i += chunkSize) {
            const slice = data.slice(i, i + chunkSize)
            s.emit('stream-audio', slice)
            await new Promise(r => setTimeout(r, 20))
        }
        s.once('stream-audio-final', (d) => { console.log('final transcript', d); process.exit(0) })
        s.emit('finalize-audio')
    })
    s.on('stream-audio-error', (e) => { console.error('err', e); process.exit(1) })
}
run()
