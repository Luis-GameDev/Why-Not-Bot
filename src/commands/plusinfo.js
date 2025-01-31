const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
                    { name: 'cta', value: 'cta' }
                )
        ),
    async execute(interaction) {
        if(interaction.options.getString('type') === 'rat') {
            let dataFilePath = path.join(__dirname, '../data/plusones.json');

            let member = interaction.options.getUser('member');
            let discordId = member.id;

            if (!fs.existsSync(dataFilePath)) {
                return interaction.reply({
                    content: 'No data file found.',
                    ephemeral: true
                });
            }

            let data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
            let plusOnes = data[discordId] || [];

            if (plusOnes.length === 0) {
                return interaction.reply({
                    content: `<@${discordId}> has no RAT +1s recorded.`,
                    ephemeral: true
                });
            }

            let embeds = [];
            let currentEmbed = new EmbedBuilder()
                .setTitle(`${plusOnes.length} RAT +1s for ${member.username}`)
                .setColor(0x1e90ff)
                .setTimestamp();

            plusOnes.forEach((entry, index) => {
                let date = entry.date;
                let fieldValue = `#${index + 1}: ${date}`;

                if (currentEmbed.data.fields?.length === 25) {
                    embeds.push(currentEmbed);
                    currentEmbed = new EmbedBuilder()
                        .setTitle(`${plusOnes.length} RAT +1s for ${member.username}`)
                        .setColor(0x1e90ff)
                        .setTimestamp();
                }

                currentEmbed.addFields({ name: '\u200B', value: fieldValue });
            });

            embeds.push(currentEmbed);

            for (let embed of embeds) {
                await interaction.channel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: `Listing all RAT +1s for <@${discordId}>...`,
                ephemeral: true
            });
        }

        if(interaction.options.getString('type') === 'cta') {
            let dataFilePath = path.join(__dirname, '../data/ctaplusones.json');

            let member = interaction.options.getUser('member');
            let discordId = member.id;

            if (!fs.existsSync(dataFilePath)) {
                return interaction.reply({
                    content: 'No data file found.',
                    ephemeral: true
                });
            }

            let data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
            let plusOnes = data[discordId] || [];

            if (plusOnes.length === 0) {
                return interaction.reply({
                    content: `<@${discordId}> has no CTA +1s recorded.`,
                    ephemeral: true
                });
            }

            let embeds = [];
            let currentEmbed = new EmbedBuilder()
                .setTitle(`${plusOnes.length} +1s for ${member.username}`)
                .setColor(0x1e90ff)
                .setTimestamp();

            plusOnes.forEach((entry, index) => {
                let time = new Date(entry.time).toLocaleString();
                let caller = entry.caller;

                let fieldValue = `#${index + 1}: Caller - <@${caller}> at ${time}`;

                if (currentEmbed.data.fields?.length === 25) {
                    embeds.push(currentEmbed);
                    currentEmbed = new EmbedBuilder()
                        .setTitle(`${plusOnes.length} CTA +1s for ${member.username}`)
                        .setColor(0x1e90ff)
                        .setTimestamp();
                }

                currentEmbed.addFields({ name: '\u200B', value: fieldValue });
            });

            embeds.push(currentEmbed);

            for (let embed of embeds) {
                await interaction.channel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: `Listing all CTA +1s for <@${discordId}>...`,
                ephemeral: true
            });
        }

        if(interaction.options.getString('type') === 'content') {
            let dataFilePath = path.join(__dirname, '../data/contentplusones.json');

            let member = interaction.options.getUser('member');
            let discordId = member.id;

            if (!fs.existsSync(dataFilePath)) {
                return interaction.reply({
                    content: 'No data file found.',
                    ephemeral: true
                });
            }

            let data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
            let plusOnes = data[discordId] || [];

            if (plusOnes.length === 0) {
                return interaction.reply({
                    content: `<@${discordId}> has no Content +1s recorded.`,
                    ephemeral: true
                });
            }

            let embeds = [];
            let currentEmbed = new EmbedBuilder()
                .setTitle(`${plusOnes.length} +1s for ${member.username}`)
                .setColor(0x1e90ff)
                .setTimestamp();

            plusOnes.forEach((entry, index) => {
                let time = new Date(entry.time).toLocaleString();
                let caller = entry.caller;

                let fieldValue = `#${index + 1}: Caller - <@${caller}> at ${time}`;

                if (currentEmbed.data.fields?.length === 25) {
                    embeds.push(currentEmbed);
                    currentEmbed = new EmbedBuilder()
                        .setTitle(`${plusOnes.length} Content +1s for ${member.username}`)
                        .setColor(0x1e90ff)
                        .setTimestamp();
                }

                currentEmbed.addFields({ name: '\u200B', value: fieldValue });
            });

            embeds.push(currentEmbed);

            for (let embed of embeds) {
                await interaction.channel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: `Listing all Content +1s for <@${discordId}>...`,
                ephemeral: true
            });
        }
    }
};
