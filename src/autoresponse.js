const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Variable for the audio URL to send when mentioned
const mentionedMeAudioUrl = "https://github.com/mubeeen1/Data/raw/refs/heads/main/mention.mp3"; 
// Updated autoResponses structure
const autoResponses = [
    { 
        words: ["dj"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/autovoice/menu.m4a"]
        }
    },
    { 
        words: ["mubeen", "coder"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/coder.m4a"]
        }
    },
    { 
        words: ["grave", "🪦"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/grave.mp3"]
        }
    },
    { 
        words: ["waiting"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/waiting.mp3"]
        }
    },
    { 
        words: ["spiderman", "🕷️", "🕸️"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/spiderman.mp3"]
        }
    },
    { 
        words: ["nazroon", "nazron", "👀", "ankhein", "eyes", "into eyes"], 
        urls: {
            audios: [
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/teri%20nazron%20ny.mp3", 
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/eyes.m4a", 
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/eyes1.mp3", 
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/eyes2.mp3"
            ],
            videos: [
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/eyes1.mp4", 
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/eyes2.mp4"
            ]
        }
    },
    { 
        words: ["drift"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/drift.mp3"]
        }
    },
    { 
        words: ["bye", "👋", "bye bye", "goodbye"], 
        urls: {
            audios: [
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/bye.mp3", 
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/bye1.mp3"
            ]
        }
    },
    { 
        words: ["forever"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/forever.mp3"]
        }
    },
    { 
        words: ["romantic"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/romantic.mp3"]
        }
    },
    { 
        words: ["heartbeat", "💓", "❣️", "heart beat"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/heart%20beat.mp3"]
        }
    },
    { 
        words: ["oh my god", "omg", "😱"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/oh%20my%20god.mp3"]
        }
    },
    { 
        words: ["left"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/left.mp3"]
        }
    },
    { 
        words: ["hero", "happy", "smile"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/happy.mp3"]
        }
    },
    { 
        words: ["khoya", "beinteha", "be-inteha", "be inteha"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/khoya.mp3"]
        }
    },
    { 
        words: ["apt", "black pink", "rose", "🌹", "🌺", "🌻", "🌼"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/apt.mp3"],
            videos: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/apt.mp4"]
        }
    },
    { 
        words: ["pain", "hurt", "broken", "💔", "😭", "😑"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/pain.mp3"],
            videos: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/pain.mp4"]
        }
    },
    { 
        words: ["without me", "without", "fish in the sea", "fish"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/wihout.mp3"]
        }
    },
    { 
        words: ["supposed"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/supposed.mp3"]
        }
    },
    { 
        words: ["stranger", "strange", "coming to the tree", "hanging", "murder"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/stranger.mp3"]
        }
    },
    { 
        words: ["senorita", "camila caballo", "shawn mendes"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/senorita.mp3"]
        }
    },
    { 
        words: ["monster", "bad", "🤤"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/monster.mp3"]
        }
    },
    { 
        words: ["alone", "faded", "alan", "alan walker"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/alone.mp3"]
        }
    },
    { 
        words: ["melody"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/melody.mp3"]
        }
    },
    { 
        words: ["sabar"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/sabar.mp3"],
            videos: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/sabar.mp4"]
        }
    },
    { 
        words: ["sad", "sadness"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/sad.mp3"]
        }
    },
    { 
        words: ["harami", "beta"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/harami.mp3"]
        }
    },
    { 
        words: ["hawas", "darinda", "🤤", "hawasi"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/hawas.mp3"]
        }
    },
    { 
        words: ["maza", "bheedo"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/maza.mp3"]
        }
    },
    { 
        words: ["shabash", "bhut bhadiya", "bhadiya"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/shabash.mp3"]
        }
    },
    { 
        words: ["smjha", "tu smjha", "smjha nhin", "smjhi", "piyari", "smjh gayi", "smjh"], 
        urls: {
            audios: [
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/smjha.mp3", 
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/piyari.mp3"
            ]
        }
    },
    { 
        words: ["kiya batt hai", "kiya bat hai", "kya batt hai", "kya bat hai", "ye batt", "ye bat"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/kya%20bata%20hai.mp3"]
        }
    },
    { 
        words: ["utha ly", "ghareebon", "ghareebi"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/utha%20ly.mp3"]
        }
    },
    { 
        words: ["fucked up", "fuck", "fu*k", "f**k", "f*ck"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/fuckedup.mp3"]
        }
    },
    { 
        words: ["hug", "🫂", "🤗", "galy lago", "seeny sy lago", "seeny sy"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/hug.mp3"],
            videos: [
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/hug.mp4", 
                "https://github.com/mubeeen1/Data/raw/refs/heads/main/hug1.mp4"
            ]
        }
    },
    { 
        words: ["ishq", "piyar", "sukoon", "love", "😙", "😚"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/ishq.mp3"]
        }
    },
    { 
        words: ["jaon", "rukon", "ruk", "jaon??", "rukon"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/jaon.mp3"]
        }
    },
    { 
        words: ["chalo", "🚗", "🌬️"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/chalo.mp3"]
        }
    },
    {
        words: ["bewajah", "be wajah", "be-wajah", "awayein", "awein", "awayen"], 
        urls: {
            audios: ["https://github.com/mubeeen1/Data/raw/refs/heads/main/bewajah.mp3"]
        }
    }
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
            const uniqueResponses = new Map();
            for (const matchedResponse of matchedResponses) {
                const uniqueWords = matchedResponse.words.filter(word => lowerCaseText.includes(word));
                if (uniqueWords.length > 0) {
                    // Use the first matched response as the key
                    const key = matchedResponse.words.join(',');
                    if (!uniqueResponses.has(key)) {
                        uniqueResponses.set(key, matchedResponse);
                    }
                }
            }

            // Collect all audio and video URLs to send
            const audioUrlsToSend = [];
            const videoUrlsToSend = [];

            for (const response of uniqueResponses.values()) {
                console.log(`Matched keyword: ${response.words.join(', ')}`); // Log matched keywords
                audioUrlsToSend.push(...response.urls.audios);
                if (response.urls.videos) {
                    videoUrlsToSend.push(...response.urls.videos);
                }
            }

            // Initialize a flag to track if any responses were sent
            let responsesSent = false;

            // Send all audio responses
            for (const audioUrl of audioUrlsToSend) {
                await handleAudioResponse(client, message, audioUrl);
                responsesSent = true; // Set the flag to true if an audio response is sent
            }

            // Send all video responses (if needed)
            for (const videoUrl of videoUrlsToSend) {
                await handleVideoResponse(client, message, videoUrl);
                responsesSent = true; // Set the flag to true if a video response is sent
            }

            // Send confirmation message after all responses
            if (responsesSent) {
                const name = "𝙇𝙄𝙎𝙃𝙊 𝘽𝙊𝙏"; // Replace with the desired display name
                const participantId = message.key.participant ? message.key.participant.split('@')[0] : '923136701631'; // Use your number as default ID

                const fgg = {
                    key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: 'status@broadcast' },
                    message: {
                        contactMessage: {
                            displayName: name,
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${name}\nitem1.TEL;waid=${participantId}:${participantId}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                        },
                    },
                };

                const confirmationText = "The messages with the specific keyword are successfully replied by the ✯ 𝘽𝙍𝙊𝙒𝙉 𝙎𝙐𝙂𝘼𝙍 🀢.";
                
                // Send the confirmation message with the contact card quoted
                await client.sendMessage(message.key.remoteJid, { text: confirmationText }, { quoted: fgg });
            }
        }
    });
};

const handleAudioResponse = async (client, message, audioUrl) => {
    // Ensure the downloads directory exists
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir); // Create the downloads directory if it doesn't exist

    // Use a unique name for the downloaded file
    const audioFilePath = path.join(downloadDir, `audio_response_${Date.now()}.mp3`);

    try {
        // Download the audio file
        await downloadFile(audioUrl, audioFilePath);
        console.log(`Downloaded audio from URL: ${audioUrl}`);

        // Send the audio file as a voice note to the original sender
        const audioBuffer = fs.readFileSync(audioFilePath);
        
        await client.sendMessage(message.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mp4', ptt: true }, { quoted: message });
        console.log(`Sent audio response from URL: ${audioUrl}`);
   // Cleanup the downloaded file after sending
        await fs.unlink(audioFilePath);
       console.log(`Deleted audio file: ${audioFilePath}`);
    } catch (error) {
        console.error(`Error handling audio response from URL "${audioUrl}":`, error);
    }
};

const handleVideoResponse = async (client, message, videoUrl) => {
    // Ensure the downloads directory exists
    const downloadDir = path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir); // Create the downloads directory if it doesn't exist

    // Use a unique name for the downloaded file
        const videoFilePath = path.join(downloadDir, `video_response_${Date.now()}.mp4`);

    try {
        // Download the video file
        await downloadFile(videoUrl, videoFilePath);
        console.log(`Downloaded video from URL: ${videoUrl}`);

        // Send the video file to the original sender
        const videoBuffer = fs.readFileSync(videoFilePath);
        
        await client.sendMessage(message.key.remoteJid, { video: videoBuffer, mimetype: 'video/mp4' }, { quoted: message });
        console.log(`Sent video response from URL: ${videoUrl}`);
   // Cleanup the downloaded file after sending
await fs.unlink(audioFilePath);
console.log(`Deleted audio file: ${audioFilePath}`);
    } catch (error) {
        console.error(`Error handling video response from URL "${videoUrl}":`, error);
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
