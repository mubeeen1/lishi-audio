const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Define audio responses with keywords and their corresponding URLs
const audioResponses = [
    { word: "hello", url: "https://example.com/audio/hello.mp3" },
    { word: "help", url: "https://example.com/audio/help.mp3" },
    { word: "dj", url: "https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/autovoice/menu.m4a" },
    { word: "mubeen", url: "https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/autovoice/sigma.m4a" },
    {word: "grave ", url: "https://www.mediafire.com/file/3mhksjgr7go65dd/grave.mp3/file?dkey=ikgk2y0o9ip&r=1007"}
];

const initialize = (client) => {
    client.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        // Allow the bot to respond to its own messages
        if (!message.message || (message.key.fromMe && !message.message.conversation)) return;

        const text = message.message.conversation || '';
        console.log(`Received message: ${text}`); // Log the received message

        // Convert the message to lowercase for case-insensitive matching
        const lowerCaseText = text.toLowerCase();
        const matchedResponse = audioResponses.find(response => lowerCaseText.includes(response.word));

        if (matchedResponse) {
            console.log(`Matched keyword: ${matchedResponse.word}`); // Log matched keyword
            await handleAudioResponse(client, message, matchedResponse);
        } else {
            console.log('No matching keyword found.'); // Log if no match
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
        console.log(`Downloaded audio for keyword: ${response.word}`);

        // Send the audio file as a voice note to the original sender
        const audioBuffer = fs.readFileSync(audioFilePath);
        
        // Log the size of the audio buffer to ensure it's being read correctly
        console.log(`Audio buffer size: ${audioBuffer.length} bytes`);

        await client.sendMessage(message.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mp4', ptt: true }, { quoted: message });
        console.log(`Sent audio response for keyword: ${response.word} as a voice note.`);
    } catch (error) {
        console.error(`Error handling audio response for keyword "${response.word}":`, error);
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
