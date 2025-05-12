const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const P = require('pino')
const fs = require('fs')
const sharp = require('sharp')

const { state, saveState } = useSingleFileAuthState('./auth.json')

async function startSock() {
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const from = msg.key.remoteJid
        const image = msg.message.imageMessage

        if (image) {
            const buffer = await sock.downloadMediaMessage(msg)
            const sticker = await sharp(buffer).webp().toBuffer()

            await sock.sendMessage(from, {
                sticker: { url: null },
                file: sticker,
                mimetype: 'image/webp'
            }, { quoted: msg })
        }
    })
}

startSock()