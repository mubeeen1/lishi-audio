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
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            console.log('Connection closed. Reconnecting...');
            if (lastDisconnect && lastDisconnect.error) {
                console.error('Last disconnect error:', lastDisconnect.error);
                if (lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== 401) {
                    // Implement exponential backoff for reconnection
                    setTimeout(() => initializeClient(), 5000); // Retry after 5 seconds
                }
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp!');

            // Save the session ID to the .env file
            if (state && state.creds && state.creds.me) {
                const newSessionId = state.creds.me.id; // Get the session ID
                // Update the .env file with the new session ID
                await fs.writeFile('.env', `SESSION_ID=${newSessionId}\nADMIN_NUMBER=${ADMIN_NUMBER}\n`, { flag: 'a' });
                console.log(`Session ID saved to .env: ${newSessionId}`);

                // Send the session ID to the admin number
                await sendMessageWithRetry(client, `${ADMIN_NUMBER}@s.whatsapp.net`, {
                    text: `New session ID: ${newSessionId}`
                });
                console.log(`Session ID sent to admin: ${ADMIN_NUMBER}`);
            }
        }

        // Print QR code if available
        if (qr) {
            // Generate and print the QR code in a smaller format
            qrcode.generate(qr, { small: true, margin: 1, errorCorrectionLevel: 'L' }, (qrcode) => {
                console.log(qrcode);
            });
            console.log('Scan the QR code above to authenticate.');
        }
    });

    // Save credentials on update
    client.ev.on('creds.update', saveCreds);

    return client;
};

const sendMessageWithRetry = async (client, to, message, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            await client.sendMessage(to, message);
            return; // Exit if successful
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
            }
        }
    }
    console.error('All attempts to send the message failed.');
};

module.exports = { initializeClient };
