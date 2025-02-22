const { initializeWAConnection } = require('./src/auth');
const autoaudio = require('./src/autoaudio');

(async () => {
    try {
        const client = await initializeWAConnection();
        
        client.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
                autoaudio.initialize(client);
                console.log('🎉 Auto-response system activated');
            }
        });

        // Health check server
        require('http').createServer((_, res) => {
            res.writeHead(200);
            res.end('OK');
        }).listen(8000);

    } catch (error) {
        console.error('🚨 Fatal error:', error);
        process.exit(1);
    }
})();
