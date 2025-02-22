const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Define audio responses with keywords and their corresponding URLs
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

const initialize = (client) => {
    client.ev.on('messages.upsert', async (msg) => {
        const messages = msg.messages;
        for (const message of messages) {
            if (!message.message || (message.key.fromMe && !message.message.conversation)) continue;

            const text = message.message.conversation || '';
            const lowerCaseText = text.toLowerCase();

            // Find all matching responses
            const matchedResponses = audioResponses.filter(response => 
                response.words.some(word => 
                    new RegExp(`\\b${word}\\b`, 'i').test(lowerCaseText)
                )
            );

            // Deduplicate responses with same URL
            const uniqueResponses = [...new Map(
                matchedResponses.map(item => [item.url, item])
            ).values()];

            // Process each unique response
            for (const response of uniqueResponses) {
                console.log(`Matched keywords: ${response.words.join(', ')}`);
                await handleAudioResponse(client, message, response);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
            }
        }
    });
};

const handleAudioResponse = async (client, message, response) => {
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir);
    
    // Generate unique filename
    const filename = `${Date.now()}_${response.words[0].replace(/[^a-z0-9]/gi, '_')}.mp3`;
    const audioFilePath = path.join(downloadDir, filename);

    try {
        // Download and validate file
        await downloadFile(response.url, audioFilePath);
        console.log(`Downloaded audio for: ${response.words.join(', ')}`);

        // Read file asynchronously
        const audioBuffer = await fs.readFile(audioFilePath);
        
        // Send with correct MIME type
        await client.sendMessage(message.key.remoteJid, { 
            audio: audioBuffer, 
            mimetype: 'audio/mpeg',
            ptt: true 
        }, { quoted: message });

        console.log(`Sent response for: ${response.words.join(', ')}`);
    } catch (error) {
        console.error(`Error handling "${response.words.join(', ')}":`, error.message);
    } finally {
        // Cleanup file
        try {
            await fs.unlink(audioFilePath);
        } catch (cleanupError) {
            console.error('Cleanup failed:', cleanupError.message);
        }
    }
};

const downloadFile = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            validateStatus: status => status === 200
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        // Cleanup partial downloads
        await fs.unlink(outputPath).catch(() => {});
        throw new Error(`Download failed: ${error.message}`);
    }
};

module.exports = { initialize };
