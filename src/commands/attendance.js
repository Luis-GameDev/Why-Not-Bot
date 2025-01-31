const { SlashCommandBuilder } = require('@discordjs/builders');
const path = require("path");
const fs = require("fs");
const Plusones = require("../plusones.js");
const { MessageEmbed } = require('discord.js');
const { EmbedBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('attendance')
        .setDescription('Tracks every user within your voice channel.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose "content" or "cta"')
                .setRequired(true)
                .addChoices(
                    { name: 'content', value: 'content' },
                    { name: 'cta', value: 'cta' }
                )
        ),

    async execute(interaction) {
        if(interaction.options.getString('type') === 'cta') {
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

            await interaction.reply(`Tracked CTA-attendance for ${members.size} Members in your Voice Channel.`);
        }

        if(interaction.options.getString('type') === 'content') {
            const channel = interaction.member.voice.channel;

            if (!channel) {
                await interaction.reply('You need to be in a voice channel to use this command.');
                return;
            }

            const members = channel.members;
            let caller = interaction.user.id;
            
            members.forEach(member => {
                Plusones.addContentPlus(member.id, caller)
            })

            // logging logic 
            const embed = new EmbedBuilder()
                .setTitle(`Content-Attendance logged by ${interaction.user.username}`)
                .setDescription(members.map(member => member.user).join('\n'))
                
            const logChannel = interaction.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
            if (logChannel) {
                logChannel.send({ embeds: [embed] });
            }

            await interaction.reply(`Tracked Content-attendance for ${members.size} Members in your Voice Channel.`);
        }

    },
};
