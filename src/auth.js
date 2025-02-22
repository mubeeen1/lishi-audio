const { create, Client } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const dotenv = require('dotenv');

dotenv.config();

const SESSION_PATH = './sessions/creds.json';

const initializeClient = async (sessionId) => {
    let client;

    if (sessionId) {
        try {
            const sessionData = await fs.readJson(SESSION_PATH);
            client = create({ auth: sessionData });
            console.log('Session loaded successfully.');
        } catch (error) {
            console.error('Failed to load session:', error);
            return await createNewSession();
        }
    } else {
        client = await createNewSession();
    }

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log('Connection closed. Reconnecting...');
            if (lastDisconnect.error.output.statusCode !== 401) {
                initializeClient(sessionId);
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp!');
        }
    });

    return client;
};

const createNewSession = async () => {
    const client = create();
    client.ev.on('creds.update', async (creds) => {
        await fs.outputJson(SESSION_PATH, creds);
        process.env.SESSION_ID = creds.me.id; // Update session ID in .env
        console.log('Session credentials saved.');
    });

    client.ev.on('qr', (qr) => {
        console.log('Scan this QR code:', qr);
    });

    await client.connect();
    return client;
};

module.exports = { initializeClient };
