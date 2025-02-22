const { makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const qrcode = require('qrcode-terminal');

dotenv.config();

const SESSION_PATH = './sessions';
const SESSION_FILE = path.join(SESSION_PATH, 'session.json');
const MAX_RETRIES = 5;
const RETRY_DELAY = 10000;

let clientInstance = null;
let retryCount = 0;
let isConnected = false;
let sessionIdSent = false;

async function initializeWAConnection() {
    try {
        await fs.ensureDir(SESSION_PATH);
        
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
        
        const client = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            connectTimeoutMs: 30000,
            keepAliveIntervalMs: 20000,
            browser: ['Ubuntu', 'Chrome', '121.0.0'],
            logger: { level: 'warn' }
        });

        client.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection === 'open') {
                handleSuccessfulConnection(client);
            }

            if (connection === 'close') {
                await handleConnectionClose(lastDisconnect);
            }

            if (qr && !isConnected) {
                handleQRGeneration(qr);
            }
        });

        client.ev.on('creds.update', saveCreds);

        setupProcessHandlers(client);
        clientInstance = client;

        return client;

    } catch (error) {
        console.error('Initialization error:', error.message);
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            await delay(RETRY_DELAY);
            return initializeWAConnection();
        }
        throw error;
    }
}

async function handleSuccessfulConnection(client) {
    isConnected = true;
    retryCount = 0;
    console.log('✓ Successfully connected to WhatsApp');

    if (!sessionIdSent && process.env.ADMIN_NUMBER) {
        const sessionId = await generateAndSaveSessionId();
        await sendSessionToAdmin(client, sessionId);
        sessionIdSent = true;
    }
}

async function handleConnectionClose(lastDisconnect) {
    isConnected = false;
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    
    console.log(`Connection closed. Status: ${statusCode || 'unknown'}`);
    
    if (statusCode !== 401 && retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`↻ Reconnecting... (Attempt ${retryCount}/${MAX_RETRIES})`);
        await delay(RETRY_DELAY);
        initializeWAConnection();
    }
}

function handleQRGeneration(qr) {
    console.log('⎚ Scan this QR code within 60 seconds:');
    qrcode.generate(qr, { small: true });
}

async function generateAndSaveSessionId() {
    const sessionId = process.env.SESSION_ID || 
        Math.random().toString(36).slice(2, 15) + 
        Math.random().toString(36).slice(2, 15);

    if (!process.env.SESSION_ID) {
        await updateEnvFile(sessionId);
    }

    await fs.writeJSON(SESSION_FILE, {
        id: sessionId,
        created: new Date().toISOString(),
        platform: process.platform
    }, { spaces: 2 });

    return sessionId;
}

async function updateEnvFile(sessionId) {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf-8').catch(() => '');
    
    const sessionLine = `SESSION_ID=${sessionId}`;
    envContent = envContent.includes('SESSION_ID=')
        ? envContent.replace(/SESSION_ID=.*/, sessionLine)
        : `${envContent}\n${sessionLine}`;

    await fs.writeFile(envPath, envContent);
}

async function sendSessionToAdmin(client, sessionId) {
    try {
        const adminJid = `${process.env.ADMIN_NUMBER.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        
        await client.sendMessage(adminJid, {
            text: `🔐 *Your Session ID*\n\n` +
                  `\`\`\`${sessionId}\`\`\`\n\n` +
                  `Keep this safe for future connections!`
        });
        
        console.log('✓ Session ID sent to admin');
    } catch (error) {
        console.error('Failed to send session ID:', error.message);
    }
}

function setupProcessHandlers(client) {
    process.on('SIGINT', async () => {
        console.log('\n⎋ Gracefully shutting down...');
        await client.end();
        process.exit(0);
    });

    process.on('uncaughtException', async (error) => {
        console.error('Critical error:', error);
        await client.end();
        process.exit(1);
    });
}
module.exports = {
    initializeWAConnection,
    getClient: () => clientInstance,
    connectionStatus: () => isConnected
};
