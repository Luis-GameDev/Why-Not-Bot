const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const stickyPath = path.join(__dirname, './data/stickymessages.json');
const cooldowns = {};

function readStickyData() {
    if (!fs.existsSync(stickyPath)) return {};
    return JSON.parse(fs.readFileSync(stickyPath, 'utf8'));
}

function writeStickyData(data) {
    fs.writeFileSync(stickyPath, JSON.stringify(data, null, 2));
}

module.exports = async function stickyHandler(message) {
    if (message.author.bot) return;

    const data = readStickyData();
    const channelId = message.channel.id;
    const stickyEntry = Object.values(data).find(e => e.channelId === channelId);
    if (!stickyEntry) return;

    if (stickyEntry.messageId) {
        try {
            const oldMsg = await message.channel.messages.fetch(stickyEntry.messageId);
            await oldMsg.delete();
        } catch (err) {
            console.warn(`Could not delete sticky message: ${err.message}`);
        } finally {
            stickyEntry.messageId = null;
            writeStickyData(data);
        }
    }

    if (cooldowns[channelId]) clearTimeout(cooldowns[channelId]);

    cooldowns[channelId] = setTimeout(async () => {
        let sent;
        if (stickyEntry.embed) {
            const embed = new EmbedBuilder()
                .setDescription(stickyEntry.text)
                .setColor(0xfcd34d);
            sent = await message.channel.send({ embeds: [embed] });
        } else {
            sent = await message.channel.send({ content: stickyEntry.text });
        }

        stickyEntry.messageId = sent.id;
        writeStickyData(data);
    }, 2 * 60 * 1000); // 2 Min
};
