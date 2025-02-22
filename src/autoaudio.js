const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { Boom } = require('@hapi/boom');

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const audioResponses = [
    { words: ["dj"], url: "https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/autovoice/menu.m4a" },
    { words: ["mubeen", "coder"], url: "https://archive.org/download/grave_202502/coder.mp3" },
    { words: ["grave", "🪦"], url: "https://archive.org/download/grave_202502/grave.mp3" },
    { words: ["waiting"], url: "https://archive.org/download/grave_202502/waiting.mp3" },
    { words: ["spiderman", "🕷️", "🕸️"], url: "https://archive.org/download/grave_202502/spiderman.mp3" },
    { words: ["eyes", "into eyes"], url: "https://archive.org/download/grave_202502/eyes.mp3" },
    { words: ["nazroon", "nazron", "👀", "ankhein"], url: "https://archive.org/download/grave_202502/teri%20nazron%20ny.mp3" },
    { words: ["drift"], url: "https://archive.org/download/grave_202502/drift.mp3" },
    { words: ["bye", "👋"], url: "https://archive.org/download/grave_202502/bye.mp3" },
    { words: ["forever"], url: "https://archive.org/download/grave_202502/forever.mp3" },
    { words: ["romantic"], url: "https://archive.org/download/grave_202502/romantic.mp3" },
    { words: ["heartbeat", "💓", "❣️", "heart beat"], url: "https://archive.org/download/grave_202502/heart%20beat.mp3" },
    { words: ["oh my god"], url: "https://archive.org/download/grave_202502/oh%20my%20god.mp3" },
    { words: ["left"], url: "https://archive.org/download/grave_202502/left.mp3" },
    { words: ["hero", "happy", "smile"], url: "https://archive.org/download/grave_202502/happy.mp3" },
    { words: ["khoya", "beinteha", "be-inteha", "be inteha"], url: "https://archive.org/download/grave_202502/khoya.mp3" },
];
const getMessageText = (message) => {
    const messageTypes = [
        'conversation',
        'extendedTextMessage.text',
        'imageMessage.caption',
        'videoMessage.caption',
        'buttonsResponseMessage.selectedButtonId',
        'listResponseMessage.title'
    ];
    
    return messageTypes.reduce((acc, type) => {
        if (acc) return acc;
        const parts = type.split('.');
        return parts.reduce((obj, part) => obj?.[part], message.message);
    }, '') || '';
};

const initialize = (client) => {
    client.ev.on('messages.upsert', async (msg) => {
        try {
            const processingQueue = [];
            const now = Date.now();
            
            for (const message of msg.messages) {
                // Skip messages older than 1 minutes
                if (now - message.messageTimestamp * 1000 > 60000) continue;

                processingQueue.push(processMessage(client, message));
            }

            // Process messages in parallel with concurrency control
            await Promise.allSettled(processingQueue);
        } catch (error) {
            console.error('Message processing failed:', error);
        }
    });
};

async function processMessage(client, message) {
    try {
        if (message.key.fromMe || !message.message) {
            console.log('Skipped self/invalid message');
            return;
        }

        const text = getMessageText(message);
        console.log(`Processing message: "${text}" from ${message.key.remoteJid}`);

        if (!text.trim()) return;

        const matchedResponses = audioResponses.filter(response => 
            response.words.some(word => {
                const pattern = /[\p{Emoji}]/u.test(word)
                    ? escapeRegExp(word)
                    : `\\b${escapeRegExp(word)}\\b`;

                return new RegExp(pattern, 'iu').test(text);
            })
        );

        if (matchedResponses.length === 0) return;

        console.log(`Matched ${matchedResponses.length} responses in ${message.key.remoteJid}`);
        
        const uniqueResponses = [...new Map(
            matchedResponses.map(item => [item.url, item])
        ).values()];

        // Process responses in parallel with rate limiting
        await Promise.allSettled(
            uniqueResponses.map(response => 
                handleAudioResponse(client, message, response)
        );
        
    } catch (error) {
        console.error('Message processing error:', error);
    }
}

const handleAudioResponse = async (client, message, audioResponse) => {
    const downloadDir = path.join(__dirname, '../downloads', Date.now().toString());
    await fs.ensureDir(downloadDir);
    
    const filename = `${audioResponse.words[0].replace(/[^\p{L}\p{N}]/giu, '_')}.mp3`;
    const audioFilePath = path.join(downloadDir, filename);

    try {
        console.log(`Starting download for: ${audioResponse.words.join(', ')}`);
        
        // Validate URL
        const { data: audioStream } = await axios({
            url: audioResponse.url,
            method: 'GET',
            responseType: 'stream',
            timeout: 15000,
            validateStatus: status => status === 200
        });

        const writer = fs.createWriteStream(audioFilePath);
        audioStream.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`Sending audio for: ${audioResponse.words.join(', ')}`);
        
        await client.sendMessage(message.key.remoteJid, { 
            audio: fs.readFileSync(audioFilePath),
            mimetype: 'audio/mpeg',
            ptt: true
        }, {
            quoted: message,
            upload: true,
            mediaUploadTimeoutMs: 30000
        });

        console.log(`Successfully sent: ${audioResponse.words.join(', ')}`);
    } catch (error) {
        if (error instanceof Boom && error.output.statusCode === 429) {
            console.log('Rate limited - delaying next response');
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            console.error(`Response error [${audioResponse.words.join(', ')}]:`, error.message);
        }
    } finally {
        try {
            await fs.remove(downloadDir);
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError.message);
        }
    }
};

module.exports = { initialize };
