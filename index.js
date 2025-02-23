const { initializeClient } = require('./src/auth');
const autoresponse = require('./src/autoresponse');

(async () => {
    try {7
        const client = await initializeClient();
        
        client.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
                autoresponse.initialize(client);
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
