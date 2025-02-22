const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Define audio responses with keywords and their corresponding URLs
const audioResponses = [
    { words: ["hello"], url: "https://example.com/audio/hello.mp3" },
    { words: ["help"], url: "https://example.com/audio/help.mp3" },
    { words: ["dj"], url: "https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/autovoice/menu.m4a" },
    { words: ["mubeen", "coder"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/coder.mp3" },
    { words: ["grave", "🪦"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/grave.mp3" },
    { words: ["waiting"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/waiting.mp3" },
    { words: ["spiderman", "🕷️", "🕸️"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/spiderman.mp3" },
    { words: ["eyes", "into eyes"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/eyes.mp3" },
    { words: ["nazroon", "nazron", "👀", "ankhein"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/teri%20nazron%20ny.mp3" },
    { words: ["drift"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/drift.mp3" },
    { words: ["bye", "👋"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/bye.mp3" },
    { words: ["forever"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/forever.mp3" },
    { words: ["romantic"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/romantic.mp3" },
    { words: ["heartbeat", "💓", "❣️", "heart beat"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/heart%20beat.mp3" },
    { words: ["oh my god"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/oh%20my%20god.mp3" },
    { words: ["left"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/left.mp3" },
    { words: ["hero", "happy", "smile"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/happy.mp3" },
    { words: ["khoya", "beinteha", "be-inteha", "be inteha"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/khoya.mp3" },
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

            // Handle all matched responses
            for (const matchedResponse of matchedResponses) {
                console.log(`Matched keyword: ${matchedResponse.words.join(', ')}`); // Log matched keywords
                await handleAudioResponse(client, message, matchedResponse);
            }
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
        
        // Download the audio file with retry logic
        await downloadFileWithRetry(response.url, audioFilePath);

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

const downloadFileWithRetry = async (url, filePath, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const { data: audioStream } = await axios({
                url: url,
                method: 'GET',
                responseType: 'stream',
                timeout: 15000,
                validateStatus: status => status === 200
            });

            const writer = fs.createWriteStream(filePath);
            audioStream.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            return; // Exit if successful
        } catch (error) {
            console.error(`Download attempt ${attempt + 1} failed: ${error.message}`);
            if (attempt === retries - 1) {
                throw new Error(`Failed to download file after ${retries} attempts: ${url}`);
            }
        }
    }
};

module.exports = { initialize };
