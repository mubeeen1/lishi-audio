const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const qrcode = require('qrcode-terminal');

dotenv.config();

const SESSION_PATH = './sessions';
const ADMIN_NUMBER = process.env.ADMIN_NUMBER; // Load admin number from .env file

const initializeClient = async () => {
    // Ensure the sessions directory exists
    await fs.ensureDir(SESSION_PATH);

    // Use multi-file auth state to manage session
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);

    // Create the client with a custom User-Agent
    const client = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Disable built-in QR printing
        connectTimeoutMs: 60000, // Increase timeout to 60 seconds
        browser: ['MacOS Safari', '2025', 'Sonoma'], // Set custom User-Agent
    });

    client.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;

        if (connection === 'open') {
            console.log('Connected to WhatsApp!');

            // Save the session ID to the .env file
            if (state && state.creds && state.creds.me) {
                const newSessionId = state.creds.me.id; // Get the session ID
                // Update the .env file with the new session ID
                await fs.writeFile('.env', `SESSION_ID=${newSessionId}\nADMIN_NUMBER=${ADMIN_NUMBER}\n`, { flag: 'a' });
                console.log(`Session ID saved to .env: ${newSessionId}`);
            }
        }

        // Print QR code if available
        if (qr) {
            qrcode.generate(qr, { small: true, margin: 1, errorCorrectionLevel: 'L' }, (qrcode) => {
                console.log(qrcode);
            });
            console.log('Scan the QR code above to authenticate.');
        }
    });

    // Save credentials on update
    client.ev.on('creds.update', saveCreds);

    return client;

module.exports = { initializeClient };
