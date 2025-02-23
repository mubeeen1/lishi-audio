const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Global sticker metadata
global.packname = '𝓛 𝓘 𝓢 𝓗 𝓞 ┃ᴮᴼᵀ';
global.author = '✯ 𝘽𝙍𝙊𝙒𝙉 𝙎𝙐𝙂𝘼𝙍 🀢';

// Auto-response configuration
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
        const messages = msg.messages;
        const currentTime = Date.now();

        await Promise.allSettled(messages.map(async (message) => {
            try {
                // Check if the message is a text or caption message
                const isTextMessage = message.message?.conversation;
                const isCaptionMessage = message.message?.imageMessage?.caption || message.message?.videoMessage?.caption;

                if (!isTextMessage && !isCaptionMessage) return;

                // Timestamp validation (1 minute threshold)
                const messageTimestamp = message.messageTimestamp * 1000;
                if (currentTime - messageTimestamp > 60000) return;

                const text = (isTextMessage ? message.message.conversation : isCaptionMessage).toLowerCase();

                // Find matching responses
                const matchedResponses = autoResponses.filter(response => 
                    response.words.some(word => text.includes(word))
                );

                // Process unique responses
                const uniqueResponses = [...new Set(matchedResponses)];
                for (const response of uniqueResponses) {
                    await handleAutoResponse(client, message, response);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }));
    });
};

const generateContactCard = (message) => {
    const senderNumber = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
    
    return {
        key: { 
            fromMe: false, 
            participant: '0@s.whatsapp.net', 
            remoteJid: 'status@broadcast' 
        },
        message: {
            contactMessage: {
                displayName: senderNumber,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${senderNumber};;;\nFN:${senderNumber}\nitem1.TEL;waid=${senderNumber}:${senderNumber}\nitem1.X-ABLabel:Phone\nEND:VCARD`
            }
        }
    };
};

const handleAutoResponse = async (client, message, response) => {
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir);
    const contactCard = generateContactCard(message);

    try {
        // Process audio responses
        await Promise.all(response.urls.audios.map(async (audioUrl) => {
            const audioPath = path.join(downloadDir, `audio_${Date.now()}.mp3`);
            await downloadFile(audioUrl, audioPath);
            const audioBuffer = await fs.readFile(audioPath);
            await client.sendMessage(
                message.key.remoteJid, 
                { audio: audioBuffer, mimetype: 'audio/mp4', ptt: true }, 
                { quoted: contactCard }
            );
        }));

        // Process sticker responses
        await Promise.all(response.urls.stickers.map(async (stickerUrl) => {
            await client.sendMessage(
                message.key.remoteJid,
                { 
                    sticker: { 
                        url: stickerUrl,
                        packname: global.packname,
                        author: global.author
                    } 
                },
                { quoted: contactCard }
            );
        }));

        // Process video responses
        await Promise.all(response.urls.videos.map(async (videoUrl) => {
            const videoPath = path.join(downloadDir, `video_${Date.now()}.mp4`);
            await downloadFile(videoUrl, videoPath);
            const videoBuffer = await fs.readFile(videoPath);
            await client.sendMessage(
                message.key.remoteJid,
                { video: videoBuffer },
                { quoted: contactCard }
            );
        }));

        // Process text responses
        await Promise.all(response.urls.texts.map(async (text) => {
            await client.sendMessage(
                message.key.remoteJid,
                { text },
                { quoted: contactCard }
            );
        }));
    } catch (error) {
        console.error(`Error handling response for ${response.words.join(', ')}:`, error);
    } finally {
        // Cleanup downloaded files
        try {
            const files = await fs.readdir(downloadDir);
            await Promise.all(files.map(file => fs.remove(path.join(downloadDir, file))));
        } catch (cleanError) {
            console.error('Cleanup error:', cleanError);
        }
    }
};

const downloadFile = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

module.exports = { initialize };
