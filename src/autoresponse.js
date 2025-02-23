const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Global variables for sticker metadata
global.packname = '𝓛 𝓘 𝓢 𝓗 𝓞 ┃ᴮᴼᵀ';
global.author = '✯ 𝘽𝙍𝙊𝙒𝙉 𝙎𝙐𝙂𝘼𝙍 🀢';

// Define auto responses with keywords and their corresponding URLs
const autoResponses = [
    { 
        words: ["dj"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/autovoice/menu.m4a"],
            stickers: [],
            videos: [],
            texts: ["DJ is here!"]
        }
    },
    { 
        words: ["mubeen", "coder"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/coder.m4a"],
            stickers: [],
            videos: [],
            texts: ["Mubeen the coder is present!"]
        }
    },
];

// Initialize bot responses
const initialize = (client) => {
    client.ev.on('messages.upsert', async (msg) => {
        const messages = msg.messages; // Get all messages
        const currentTime = Date.now();

        for (const message of messages) {
            if (!message.message) continue; // Skip messages without content
            
            // Convert timestamp
            const messageTimestamp = message.messageTimestamp * 1000;
            if (currentTime - messageTimestamp > 60000) continue; // Ignore messages older than 1 minute

            const text = message.message.conversation || '';
            const lowerCaseText = text.toLowerCase();

            // Match responses based on keywords
            const matchedResponses = autoResponses.filter(response => 
                response.words.some(word => lowerCaseText.includes(word))
            );

            for (const response of matchedResponses) {
                console.log(`Matched keyword: ${response.words.join(', ')}`);

                // **Send the response with the correct display format (including JID)**
                await sendFormattedResponse(client, message, response);
            }
        }
    });
};

// Function to send responses correctly with the required JID display format
const sendFormattedResponse = async (client, message, response) => {
    const remoteJid = message.key.remoteJid;  // Preserve JID formatting
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir); 

    // Send text response
    for (const text of response.urls.texts) {
        await client.sendMessage(remoteJid, { text }, { quoted: message });
        console.log(`Sent text response: "${text}"`);
    }

    // Send sticker response
    for (const stickerUrl of response.urls.stickers) {
        await client.sendMessage(remoteJid, { 
            sticker: { url: stickerUrl, packname: global.packname, author: global.author } 
        }, { quoted: message });
        console.log(`Sent sticker response.`);
    }

    // Send video response
    for (const videoUrl of response.urls.videos) {
        await client.sendMessage(remoteJid, { video: { url: videoUrl } }, { quoted: message });
        console.log(`Sent video response.`);
    }

    // Handle audio responses
    for (const audioUrl of response.urls.audios) {
        const audioFilePath = path.join(downloadDir, `audio_response_${Date.now()}.mp3`);
        try {
            await downloadFile(audioUrl, audioFilePath);
            console.log(`Downloaded audio for keywords: ${response.words.join(', ')}`);

            const audioBuffer = fs.readFileSync(audioFilePath);
            await client.sendMessage(remoteJid, { audio: audioBuffer, mimetype: 'audio/mp4', ptt: true }, { quoted: message });
            console.log(`Sent audio response.`);
        } catch (error) {
            console.error(`Error sending audio response:`, error);
        }
    }

    // Cleanup downloaded files
    await cleanupDownloads(downloadDir);
};

// Function to download files
const downloadFile = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

// Cleanup function
const cleanupDownloads = async (downloadDir) => {
    try {
        const files = await fs.readdir(downloadDir);
        for (const file of files) {
            await fs.remove(path.join(downloadDir, file));
            console.log(`Removed file: ${file}`);
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
};

module.exports = { initialize };
