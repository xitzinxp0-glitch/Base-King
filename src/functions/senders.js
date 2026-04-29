const getSenders = (client, msg) => {
    const from = msg.key.remoteJid;
    return {
        kingmsg: async (text) => {
            return await client.sendMessage(from, { text: text }, { quoted: msg });
        },
        kingaudio: async (audio, ptt = false) => {
            return await client.sendMessage(from, { audio: audio, ptt: ptt, mimetype: "audio/mp4" }, { quoted: msg });
        },
        kingmenu: async (text, image) => {
            return await client.sendMessage(from, { image: image, caption: text }, { quoted: msg });
        },
        kingfile: async (file, mimetype, filename) => {
            return await client.sendMessage(from, { document: file, mimetype: mimetype, fileName: filename }, { quoted: msg });
        },
        kingreact: async (emoji) => {
            return await client.sendMessage(from, { react: { text: emoji, key: msg.key } });
        }
    };
};

module.exports = { getSenders };
//Created by R.Santos; Contato: +5562982053713
