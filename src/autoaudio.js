const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Define audio responses with keywords and their corresponding URLs
const audioResponses = [
    { words: ["hello"], url: "https://example.com/audio/hello.mp3" },
    { words: ["help"], url: "https://example.com/audio/help.mp3" },
    { words: ["dj"], url: "https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/autovoice/menu.m4a" },
    { words: ["mubeen"], url: "https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/autovoice/sigma.m4a" },
    { words: ["grave", "🪦"], url: "https://www.mediafire.com/file/3mhksjgr7go65dd/grave.mp3/file?dkey=ikgk2y0o9ip&r=1007" }
];

const initialize = (client) => {
    client.ev.on('messages.upsert', async (msg) => {
        const messages = msg.messages; // Get all messages
        for (const message of messages) {
            // Allow the bot to respond to its own messages
            if (!message.message || (message.key.fromMe && !message.message.conversation)) continue;

            const text = message.message.conversation || '';
            const lowerCaseText = text.toLowerCase(); // Convert to lowercase for case-insensitive matching

            // Check for matching keywords
            const matchedResponses = audioResponses.filter(response => 
                response.words.some(word => lowerCaseText.includes(word))
            );

            // Handle all matched responses
            for (const matchedResponse of matchedResponses) {
                console.log(`Matched keyword: ${matchedResponse.words.join(', ')}`); // Log matched keywords
                await handleAudioResponse(client, message, matchedResponse);
            }
        }
    });
};

const handleAudioResponse = async (client, message, response) => {
    // Ensure the downloads directory exists
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir); // Create the downloads directory if it doesn't exist

    // Use a generic name for the downloaded file
    const audioFilePath = path.join(downloadDir, `audio_response.mp3`);

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
