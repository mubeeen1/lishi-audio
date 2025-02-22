const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Define audio responses with keywords and their corresponding URLs
const audioResponses = [
    { words: ["hello"], url: "https://example.com/audio/hello.mp3" },
    { words: ["help"], url: "https://example.com/audio/help.mp3" },
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
        const messages = msg.messages || []; // Get all messages
        const now = Date.now();

        // Process only new messages
        for (const message of messages) {
            // Skip messages older than 1 minute and self-messages
            if (now - message.messageTimestamp * 1000 > 60000 || message.key.fromMe) continue;

            const text = message.message.conversation || '';
            const lowerCaseText = text.toLowerCase().trim(); // Convert to lowercase for case-insensitive matching

            // Check for matching keywords
            const matchedResponses = audioResponses.filter(response => 
                response.words.some(word => 
                    new RegExp(createPattern(word), 'iu').test(lowerCaseText)
                )
            );

            // Handle all matched responses concurrently
            const downloadPromises = matchedResponses.map(matchedResponse => 
                handleAudioResponse(client, message, matchedResponse)
            );

            // Wait for all downloads to complete
            await Promise.all(downloadPromises);
        }
    });
};

const createPattern = (word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return /[\p{Emoji}]/u.test(word) 
        ? escaped 
        : `(?<!\\w)${escaped}(?!\\w)`; // Word boundary for non-emoji
};

const handleAudioResponse = async (client, message, response) => {
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir); // Ensure the downloads directory exists

    const audioFilePath = path.join(downloadDir, `${response.words[0].replace(/[^\p{L}\p{N}]/giu, '_')}.mp3`);

    try {
        console.log(`Starting download for: ${response.words.join(', ')}`);
        
        // Download the audio file
        const { data: audioStream } = await axios({
            url: response.url,
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

        console.log(`Successfully downloaded: ${response.words.join(', ')}`);

        // Send the audio file as a voice note to the original sender
        await client.sendMessage(message.key.remoteJid, {
            audio: { url: audioFilePath },
            mimetype: 'audio/mpeg',
            ptt: true
        }, {
            quoted: message
        });

        console.log(`Successfully sent: ${response.words.join(', ')} to ${message.key.remoteJid}`);
    } catch (error) {
        console.error(`Error handling audio response for keywords "${response.words.join(', ')}":`, error.message);
    } finally {
        // Clean up the downloaded file
        await fs.remove(audioFilePath).catch(err => console.error('Cleanup error:', err.message));
    }
};

module.exports = { initialize };
