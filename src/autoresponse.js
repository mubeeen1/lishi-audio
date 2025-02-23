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
    { 
        words: ["grave", "🪦"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/grave.mp3"],
            stickers: [],
            videos: [],
            texts: ["This is a grave situation!"]
        }
    },
    { 
        words: ["waiting"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/waiting.mp3"],
            stickers: [],
            videos: [],
            texts: ["I am waiting..."]
        }
    },
    { 
        words: ["spiderman", "🕷️", "🕸️"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/spiderman.mp3"],
            stickers: [],
            videos: [],
            texts: ["Spiderman is here!"]
        }
    },
    { 
        words: ["eyes", "into eyes"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/eyes.m4a"],
            stickers: [],
            videos: [],
            texts: ["Looking into your eyes..."]
        }
    },
    { 
        words: ["nazroon", "nazron", "👀", "ankhein"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/teri%20nazron%20ny.mp3"],
            stickers: [],
            videos: [],
            texts: ["Nazron se nazar milana..."]
        }
    },
    { 
        words: ["drift"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/drift.mp3"],
            stickers: [],
            videos: [],
            texts: ["Let's drift!"]
        }
    },
    { 
        words: ["bye", "👋"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/bye.mp3"],
            stickers: [],
            videos: [],
            texts: ["Goodbye!"]
        }
    },
    { 
        words: ["forever"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/forever.mp3"],
            stickers: [],
            videos: [],
            texts: ["Forever and always!"]
        }
    },
    { 
        words: ["romantic"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/romantic.mp3"],
            stickers: [],
            videos: [],
            texts: ["This is so romantic!"]
        }
    },
    { 
        words: ["heartbeat", "💓", "❣️", "heart beat"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/heart%20beat.mp3"],
            stickers: [],
            videos: [],
            texts: ["Feel the heartbeat!"]
        }
    },
    { 
        words: ["oh my god"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/oh%20my%20god.mp3"],
            stickers: [],
            videos: [],
            texts: ["Oh my God!"]
        }
    },
    { 
        words: ["left"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/left.mp3"],
            stickers: [],
            videos: [],
            texts: ["Turn left!"]
        }
    },
    { 
        words: ["hero", "happy", "smile"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/happy.mp3"],
            stickers: [],
            videos: [],
            texts: ["You are my hero!"]
        }
    },
    { 
        words: ["khoya", "beinteha", "be-inteha", "be inteha"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/khoya.mp3"],
            stickers: [],
            videos: [],
            texts: ["Khoya khoya rehta hoon..."]
        }
    },
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
            const matchedResponses = autoResponses.filter(response => 
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
                await handleAutoResponse(client, message, response);
            }
        }
    });
};

const handleAutoResponse = async (client, message, response) => {
    // Ensure the downloads directory exists
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir); // Create the downloads directory if it doesn't exist

    // Handle audio responses
    for (const audioUrl of response.urls.audios) {
        const audioFilePath = path.join(downloadDir, `audio_response_${Date.now()}.mp3`);
        try {
            await downloadFile(audioUrl, audioFilePath);
            console.log(`Downloaded audio for keywords: ${response.words.join(', ')}`);

            const audioBuffer = fs.readFileSync(audioFilePath);
            await client.sendMessage(message.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mp4', ptt: true }, { quoted: message });
            console.log(`Sent audio response for keywords: ${response.words.join(', ')}`);
        } catch (error) {
            console.error(`Error handling audio response for keywords "${response.words.join(', ')}":`, error);
        }
    }

    // Handle sticker responses (if any)
    for (const stickerUrl of response.urls.stickers) {
        // Send sticker with metadata
        await client.sendMessage(message.key.remoteJid, { sticker: { url: stickerUrl, packname: global.packname, author: global.author } }, { quoted: message });
        console.log(`Sent sticker response for keywords: ${response.words.join(', ')}`);
    }

    // Handle video responses (if any)
    for (const videoUrl of response.urls.videos) {
        // Send video
        await client.sendMessage(message.key.remoteJid, { video: { url: videoUrl } }, { quoted: message });
        console.log(`Sent video response for keywords: ${response.words.join(', ')}`);
    }

    // Handle text responses (if any)
    for (const text of response.urls.texts) {
        // Send text message
        await client.sendMessage(message.key.remoteJid, { text }, { quoted: message });
        console.log(`Sent text response for keywords: ${response.words.join(', ')}`);
    }

    // Clean up downloaded files
    try {
        const files = await fs.readdir(downloadDir);
        for (const file of files) {
            const filePath = path.join(downloadDir, file);
            await fs.remove(filePath);
            console.log(`Removed file: ${filePath}`);
        }
    } catch (error) {
        console.error('Error cleaning up downloaded files:', error);
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
