const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const audioResponses = [
    { word: "hello", url: "https://example.com/audio/hello.ppt" },
    { word: "help", url: "https://example.com/audio/help.ppt" },
    { word:"dj", url :"https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/autovoice/menu.m4a"},
   {word: "mubeen", url:"https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/autovoice/sigma.m4a" },
];

const initialize = (client) => {
    client.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (message.key.fromMe || !message.message) return;

        const text = message.message.conversation || '';
        const matchedResponse = audioResponses.find(response => text.includes(response.word));

        if (matchedResponse) {
            await handleAudioResponse(client, message, matchedResponse);
        }
    });
};

const handleAudioResponse = async (client, message, response) => {
    const audioFilePath = path.join(__dirname, '../downloads', `${response.word}.ppt`);

    try {
        // Download the audio file
        await downloadFile(response.url, audioFilePath);
        console.log(`Downloaded audio for keyword: ${response.word}`);

        // Send the audio file as a voice note
        await client.sendMessage(message.key.remoteJid, { audio: fs.readFileSync(audioFilePath), mimetype: 'audio/mp4' }, { quoted: message });
        console.log(`Sent audio response for keyword: ${response.word}`);
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
