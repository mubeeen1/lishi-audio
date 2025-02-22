const http = require('http');
const { initializeClient } = require('./src/auth');
const autoaudio = require('./src/autoaudio');

const startBot = async () => {
    const client = await initializeClient();

    // Initialize autoaudio only after successful connection
    client.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('Connected to WhatsApp!');
            autoaudio.initialize(client); // Initialize autoaudio here
        }
    });

    // Start a simple HTTP server for health checks
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is running\n');
    });

    server.listen(8000, () => {
        console.log('Health check server running on port 8000');
    });
};

startBot().catch(err => console.error('Error starting bot:', err));
