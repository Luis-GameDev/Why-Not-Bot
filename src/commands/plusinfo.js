const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Plusones = require("../plusones.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plusinfo')
        .setDescription('Displays all +1s of a specified user.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member whose +1s you want to view.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose "rat", "content" or "cta"')
                .setRequired(true)
                .addChoices(
                    { name: 'rat', value: 'rat' },
                    { name: 'content', value: 'content' },
                    { name: 'cta', value: 'cta' },
                    { name: 'focus', value: 'focus' },
                    { name: 'vod', value: 'vod' },
                    { name: 'scout', value: 'scout' }
                )
        ),
    async execute(interaction) {
        const type = interaction.options.getString('type');
        const member = interaction.options.getUser('member');
        const discordId = member.id;
        let plusones;
        let fieldInfo;
        let date;

        switch (type) {
            case 'rat':
            plusones = Plusones.getRatPlus(discordId);
            break;
            case 'cta':
            plusones = Plusones.getCtaPlus(discordId);
            break;
            case 'content':
            plusones = Plusones.getContentPlus(discordId);
            break;
            case 'focus':
            plusones = Plusones.getFocusPlus(discordId);
            break;
            case 'vod':
            plusones = Plusones.getVodPlus(discordId);
            break;
            case 'scout':
            plusones = Plusones.getScoutPlus(discordId);
            break;
        }

        let embeds = [];
        let currentEmbed = new EmbedBuilder()
            .setTitle(`${plusones.length} ${type} +1s for ${member.username}`)
            .setColor(0x1e90ff)
            .setTimestamp();

        plusones.forEach((entry, index) => {
        
            switch (type) {
                case 'rat':
                fieldInfo = `${entry.date}`;
                break;
                case 'cta':
                date = new Date(entry.time);
                fieldInfo = `Caller: <@${entry.caller}> at ${date.toLocaleString()}`;
                if (entry.link) {
                    fieldInfo += `: ${entry.link}`;
                }
                break;
                case 'content':
                date = new Date(entry.time);
                fieldInfo = `Caller: <@${entry.caller}> at ${date.toLocaleString()}`;
                break;
                case 'focus':
                date = new Date(entry.time);
                fieldInfo = `${date.toLocaleString()}`;
                break;
                case 'vod':
                date = new Date(entry.time);
                fieldInfo = `Reviewed by <@${entry.reviewer}> at ${date.toLocaleString()}`;
                break;
                case 'scout':
                date = new Date(entry.time);
                fieldInfo = `${entry.date} at ${date.toLocaleString()}`;
                break;
            }
            let fieldValue = `#${index + 1}: ${fieldInfo}`;

            if (currentEmbed.data.fields?.length === 25) {
                embeds.push(currentEmbed);
                currentEmbed = new EmbedBuilder()
                    .setTitle(`${plusones.length} ${type} +1s for ${member.username}`)
                    .setColor(0x1e90ff)
                    .setTimestamp();
            }

            currentEmbed.addFields({ name: '\u200B', value: fieldValue });
        });

        embeds.push(currentEmbed);

        for (let embed of embeds) {
            await interaction.reply({ embeds: [embed] });
        }
    }
};
