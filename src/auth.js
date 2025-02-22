const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

// Configure logger with pino-pretty
const logger = pino({
    level: 'warn', // Log only warnings and errors
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true, // Colorize logs
            translateTime: 'SYS:dd-mm-yyyy HH:MM:ss', // Human-readable timestamps
            ignore: 'pid,hostname' // Remove unnecessary fields
        }
    }
});

// Session configuration
const SESSION_PATH = './sessions';
let clientInstance = null;
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 10000]; // Exponential backoff

// QR Code handler
function handleQRGeneration(qr) {
    console.log('⎚ Scan this QR code within 60 seconds:');
    qrcode.generate(qr, { 
        small: true,
        scale: 2
    });
    console.log('QR Code URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qr));
}

async function initializeWAConnection() {
    try {
        await fs.ensureDir(SESSION_PATH);
        
        // Clear session on conflict
        if (retryCount > 0) {
            await fs.emptyDir(SESSION_PATH);
            logger.warn('Session cleared for fresh connection');
        }

        const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
        
        const client = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            connectTimeoutMs: 30000,
            keepAliveIntervalMs: 15000,
            browser: ['Ubuntu', 'Chrome', '121.0.0'],
            logger: logger.child({ component: 'baileys' }), // Use pino logger
            getMessage: async () => ({}),
            shouldSyncHistoryMessage: () => false,
            fetchAgent: new (require('https')).Agent({ 
                keepAlive: true,
                timeout: 45000
            })
        });

        client.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection === 'open') {
                isConnected = true;
                retryCount = 0;
                logger.info('WhatsApp connection stabilized');
            }

            if (connection === 'close') {
                isConnected = false;
                await handleConnectionClose(lastDisconnect);
            }

            if (qr) {
                handleQRGeneration(qr);
            }
        });

        client.ev.on('creds.update', saveCreds);
        clientInstance = client;

        return client;

    } catch (error) {
        logger.error(`Initialization error: ${error.message}`);
        if (retryCount < MAX_RETRIES) {
            await delay(RETRY_DELAYS[retryCount]);
            retryCount++;
            return initializeWAConnection();
        }
        throw new Error('Max connection retries reached');
    }
}

async function handleConnectionClose(lastDisconnect) {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    
    logger.warn(`Connection closed. Status: ${statusCode || 'unknown'}`);
    
    if (statusCode === DisconnectReason.connectionReplaced) {
        logger.warn('Session replaced elsewhere! Resetting...');
        await fs.remove(SESSION_PATH);
        retryCount = 0;
    }

    if (statusCode === DisconnectReason.loggedOut) {
        logger.warn('Logged out! Please log in again.');
        return; // Do not attempt to reconnect
    }

    if (statusCode !== DisconnectReason.loggedOut && retryCount < MAX_RETRIES) {
        logger.info(`Reconnecting... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await delay(RETRY_DELAYS[retryCount]);
        retryCount++;
        return initializeWAConnection();
    }
}

// Utility function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    initializeWAConnection,
    getClient: () => clientInstance,
    connectionStatus: () => isConnected
};
