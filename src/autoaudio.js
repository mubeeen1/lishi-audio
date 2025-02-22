const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Helper function to safely escape regex characters
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Enhanced audio responses configuration
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

// Unified text extraction from different message types
const getMessageText = (message) => {
    const messageTypes = [
        'conversation',
        'extendedTextMessage.text',
        'imageMessage.caption',
        'videoMessage.caption'
    ];
    
    return messageTypes.reduce((acc, type) => {
        if (acc) return acc;
        const parts = type.split('.');
        return parts.reduce((obj, part) => obj?.[part], message.message);
    }, '') || '';
};

const initialize = (client) => {
    client.ev.on('messages.upsert', async (msg) => {
        const messages = msg.messages;
        for (const message of messages) {
            try {
                // Skip messages from bot itself and invalid messages
                if (message.key.fromMe || !message.message) {
                    console.log('Skipped self/invalid message');
                    continue;
                }

                const text = getMessageText(message);
                console.log(`Processing message: "${text}"`);

                if (!text.trim()) {
                    console.log('Empty message content');
                    continue;
                }

                // Enhanced keyword matching logic
                const matchedResponses = audioResponses.filter(response => 
                    response.words.some(word => {
                        const escapedWord = escapeRegExp(word);
                        const isEmoji = /^\p{Emoji}$/u.test(word);
                        const pattern = isEmoji 
                            ? escapedWord  // Exact emoji match
                            : `(?:^|\\s)${escapedWord}(?:$|\\s|[.,!?])`;  // Word boundary with punctuation support
                        
                        return new RegExp(pattern, 'iu').test(text);
                    })
                );

                console.log(`Matched ${matchedResponses.length} responses`);

                // Deduplicate and process responses
                const uniqueResponses = [...new Map(
                    matchedResponses.map(item => [item.url, item])
                ).values()];

                for (const response of uniqueResponses) {
                    console.log(`Triggering response for: ${response.words.join(', ')}`);
                    await handleAudioResponse(client, message, response);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error('Message processing error:', error);
            }
        }
    });
};

const handleAudioResponse = async (client, message, response) => {
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir);
    
    const filename = `${Date.now()}_${response.words[0].replace(/[^\p{L}\p{N}]/giu, '_')}.mp3`;
    const audioFilePath = path.join(downloadDir, filename);

    try {
        // Validate URL before download
        console.log(`Downloading from: ${response.url}`);
        const headResponse = await axios.head(response.url);
        if (headResponse.status !== 200) {
            throw new Error(`Invalid response status: ${headResponse.status}`);
        }

        // Download with timeout
        const writer = fs.createWriteStream(audioFilePath);
        const response = await axios({
            url: response.url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Send audio with optimized settings
        await client.sendMessage(message.key.remoteJid, { 
            audio: fs.readFileSync(audioFilePath),
            mimetype: 'audio/mpeg',
            ptt: true,
            waveform: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]) // Improves compatibility
        }, { quoted: message });

        console.log(`Successfully sent: ${response.words.join(', ')}`);
    } catch (error) {
        console.error(`Response error [${response.words.join(', ')}]:`, error.message);
    } finally {
        try {
            await fs.remove(audioFilePath);
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError.message);
        }
    }
};

module.exports = { initialize };
