const http = require('http');
const { initializeWAConnection } = require('./src/auth'); // Changed import name
const autoaudio = require('./src/autoaudio');

const startBot = async () => {
    try {
        const client = await initializeWAConnection(); // Changed function name

        // Initialize autoaudio after successful connection
        client.ev.on('connection.update', async (update) => {
            if (update.connection === 'open') {
                console.log('Connected to WhatsApp!');
                autoaudio.initialize(client);
                
                // Start health check server AFTER connection
                const server = http.createServer((req, res) => {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Bot is running\n');
                });
                
                server.listen(8000, () => {
                    console.log('Health check server running on port 8000');
                });
            }
        });

    } catch (err) {
        console.error('Error starting bot:', err);
        process.exit(1);
    }
};

startBot();
