const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const qrcode = require('qrcode-terminal');

dotenv.config();

const SESSION_PATH = './sessions';

const initializeClient = async () => {
    // Ensure the sessions directory exists
    await fs.ensureDir(SESSION_PATH);

    // Use multi-file auth state to manage session
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);

    const client = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Disable built-in QR printing
        connectTimeoutMs: 30000, // Increase timeout to 30 seconds
    });

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            console.log('Connection closed. Reconnecting...');
            if (lastDisconnect && lastDisconnect.error) {
                console.error('Last disconnect error:', lastDisconnect.error);
                if (lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== 401) {
                    // Attempt to reconnect
                    await initializeClient();
                }
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp!');
        }

        // Print QR code if available
        if (qr) {
            qrcode.generate(qr, { small: true }); // Print QR code in terminal
            console.log('Scan the QR code above to authenticate.');
        }
    });

    // Save credentials on update
    client.ev.on('creds.update', saveCreds);

    // Skip chat sync by ignoring history notifications
    client.ev.on('chats.set', () => {
        console.log('Chat sync skipped.');
    });

    return client;
};

const createNewSession = async () => {
    const client = await initializeClient();
    return client;
};

module.exports = { initializeClient };
