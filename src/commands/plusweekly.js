const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/plusones.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plusweekly')
        .setDescription('Displays all +1s of a specified user from the past 7 days.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member whose +1s you want to view.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const member = interaction.options.getUser('member');
        const discordId = member.id;

        if (!fs.existsSync(dataFilePath)) {
            return interaction.reply({
                content: 'No data file found.',
                ephemeral: true
            });
        }

        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        const plusOnes = data[discordId] || [];

        if (plusOnes.length === 0) {
            return interaction.reply({
                content: `<@${discordId}> has no +1s recorded.`,
                ephemeral: true
            });
        }

        const embeds = [];
        let currentEmbed = new EmbedBuilder()
            .setTitle(`+1s for ${member.username} from the past 7 days`)
            .setColor(0x1e90ff)
            .setTimestamp();

        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        plusOnes.forEach((entry, index) => {
            const date = entry.date;
            const time = entry.time;

            if (time < oneWeekAgo) {
            return;
            }

            const fieldValue = `#${index + 1}: ${date}`;

            if (currentEmbed.data.fields?.length === 25) {
            embeds.push(currentEmbed);
            currentEmbed = new EmbedBuilder()
                .setTitle(`Recent +1s for ${member.username}`)
                .setColor(0x1e90ff)
                .setTimestamp();
            }

            currentEmbed.addFields({ name: '\u200B', value: fieldValue });
        });

        if (currentEmbed.data.fields?.length) {
            embeds.push(currentEmbed);
        }

        if (embeds.length === 0) {
            return interaction.reply({
            content: `<@${discordId}> has no +1s recorded in the past 7 days.`,
            ephemeral: true
            });
        }

        for (const embed of embeds) {
            await interaction.channel.send({ embeds: [embed] });
        }

        return interaction.reply({
            content: `Listing recent +1s for <@${discordId}>...`,
            ephemeral: true
        });
    }
};
