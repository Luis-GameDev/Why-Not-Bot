const { SlashCommandBuilder } = require('@discordjs/builders');
const path = require("path");
const fs = require("fs");
const Plusones = require("../plusones.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('attendance')
        .setDescription('Tracks every user within your voice channel.'),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(process.env.CONTENTCALLER_ROLE_ID)) {
            await interaction.reply('You do not have the required permission to use this command.');
            return;
        }

        const channel = interaction.member.voice.channel;

        if (!channel) {
            await interaction.reply('You need to be in a voice channel to use this command.');
            return;
        }

        const members = channel.members;
        let caller = interaction.user.id;
        
        members.forEach(member => {
            Plusones.addCtaPlus(member.id, caller)
        })

        await interaction.reply(`Tracked attendance for ${members.size} Members in your Voice Channel.`);
    },
};
