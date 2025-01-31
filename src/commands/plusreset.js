const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plusreset')
        .setDescription('Resets the whole +1s file')
        .addStringOption(option =>
            option.setName('file')
                .setDescription('Choose "rat", "content" or "cta"')
                .setRequired(true)
                .addChoices(
                    { name: 'rat', value: 'rat' },
                    { name: 'content', value: 'content' },
                    { name: 'cta', value: 'cta' }
                )
        ),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
            return interaction.reply({ content: 'Only officers can reset the +1s.', ephemeral: true });
        }

        let dataFilePath;
        const fileType = interaction.options.getString('file');

        if (fileType === 'rat') {
            dataFilePath = path.join(__dirname, '../data/plusones.json');
        } else if (fileType === 'cta') {
            dataFilePath = path.join(__dirname, '../data/ctaplusones.json');
        } else if (fileType === 'content') {
            dataFilePath = path.join(__dirname, '../data/contentplusones.json');
        }

        if (dataFilePath) {
            fs.writeFile(dataFilePath, JSON.stringify({}), (err) => {
                if (err) {
                    console.error(err);
                    return interaction.reply({ content: 'There was an error resetting the file.', ephemeral: true });
                }
                interaction.reply({ content: `The ${fileType} file has been reset.`, ephemeral: true });
            });
        } else {
            interaction.reply({ content: 'Invalid file type.', ephemeral: true });
        }
    }
};
