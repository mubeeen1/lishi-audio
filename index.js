const { create, Client } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const auth = require('./src/auth');
const { initializeClient } = require('./src/auth');
const autoaudio = require('./src/autoaudio');
dotenv.config();
const startBot = async () => {
    const sessionId = process.env.SESSION_ID;

    const client = await initializeClient(sessionId);
    autoaudio.initialize(client);
};

startBot().catch(err => console.error('Error starting bot:', err));
