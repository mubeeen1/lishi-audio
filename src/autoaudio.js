const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Define audio responses with keywords and their corresponding URLs
const audioResponses = [
    { words: ["dj"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/autovoice/menu.m4a" },
    { words: ["mubeen", "coder"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/coder.m4a" },
    { words: ["grave", "🪦"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/grave.mp3" },
    { words: ["waiting"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/waiting.mp3" },
    { words: ["spiderman", "🕷️", "🕸️"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/spiderman.mp3" },
    { words: ["eyes", "into eyes"], url: "https://github.com/mubeeen1/Data/raw/refs/heads/main/eyes.m4a" },
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
        const messages = msg.messages; // Get all messages
        const currentTime = Date.now();

        for (const message of messages) {
            // Allow the bot to respond to its own messages
            if (!message.message || (message.key.fromMe && !message.message.conversation)) continue;

            // Check if the message is older than 1 minute
            const messageTimestamp = message.messageTimestamp * 1000; // Convert to milliseconds
            if (currentTime - messageTimestamp > 60000) continue; // Ignore messages older than 1 minute

            const text = message.message.conversation || '';
            const lowerCaseText = text.toLowerCase(); // Convert to lowercase for case-insensitive matching

            // Check for matching keywords
            const matchedResponses = audioResponses.filter(response => 
                response.words.some(word => lowerCaseText.includes(word))
            );

            // Handle matched responses
            const uniqueResponses = new Set();
            for (const matchedResponse of matchedResponses) {
                const uniqueWords = matchedResponse.words.filter(word => lowerCaseText.includes(word));
                if (uniqueWords.length > 0) {
                    uniqueResponses.add(matchedResponse);
                }
            }

            for (const response of uniqueResponses) {
                console.log(`Matched keyword: ${response.words.join(', ')}`); // Log matched keywords
                await handleAudioResponse(client, message, response);
            }
        }
    });
};

const handleAudioResponse = async (client, message, response) => {
    // Ensure the downloads directory exists
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir); // Create the downloads directory if it doesn't exist

    // Use a unique name for the downloaded file
    const audioFilePath = path.join(downloadDir, `audio_response_${Date.now()}.mp3`);

    try {
        // Download the audio file
        await downloadFile(response.url, audioFilePath);
        console.log(`Downloaded audio for keywords: ${response.words.join(', ')}`);

        // Send the audio file as a voice note to the original sender
        const audioBuffer = fs.readFileSync(audioFilePath);
        
        await client.sendMessage(message.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mp4', ptt: true }, { quoted: message });
        console.log(`Sent audio response for keywords: ${response.words.join(', ')}`);
    } catch (error) {
        console.error(`Error handling audio response for keywords "${response.words.join(', ')}":`, error);
    }
};

const downloadFile = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

module.exports = { initialize };
