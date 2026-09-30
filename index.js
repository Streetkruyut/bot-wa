const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Silakan scan QR Code!');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba menghubungkan ulang...');
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot WhatsApp Berhasil Terhubung!');

            // Bot nge-chat kamu duluan
            const nomorKamu = '6289523384037@s.whatsapp.net'; // Ganti dengan nomor kamu
            setTimeout(async () => {
                await sock.sendMessage(nomorKamu, { text: 'Halo! Aku udah aktif nih. Ada yang mau diobrolin?' });
            }, 5000);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Merespon chat masuk layaknya manusia
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const senderID = m.key.remoteJid;
        const messageText = m.message.conversation || m.message.extendedTextMessage?.text;

        if (!messageText) return;

        console.log(`Pesan masuk: ${messageText}`);

        await sock.sendPresenceUpdate('composing', senderID);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Jeda 2 detik

        let replyText = "Hmm, begitu ya? Ceritain lagi dong!";

        if (messageText.toLowerCase().includes('halo') || messageText.toLowerCase().includes('hi')) {
            replyText = "Halo juga! Lagi sibuk apa nih sekarang?";
        } else if (messageText.toLowerCase().includes('lagi apa')) {
            replyText = "Lagi nemenin kamu aja nih. Kamu sendiri gimana kabarnya?";
        }

        await sock.sendMessage(senderID, { text: replyText }, { quoted: m });
    });
}

startBot();
