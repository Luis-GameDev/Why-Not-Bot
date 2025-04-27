const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Plusones = require("../plusones.js");
const client = require('../index.js');

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
                    { name: 'cta', value: 'cta' },
                    { name: 'focus', value: 'focus' },
                    { name: 'vod', value: 'vod' },
                    { name: 'scout', value: 'scout' },
                    { name: 'random', value: 'random' },
                    { name: 'all', value: 'all' }
                )
        ),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
            return interaction.reply({ content: 'Only officers can reset the +1s.', ephemeral: true });
        }

        let dataFilePath;
        const fileType = interaction.options.getString('file');

        switch (fileType) {
            case 'rat':
            dataFilePath = path.join(__dirname, '../data/plusones.json');
            break;
            case 'cta':
            dataFilePath = path.join(__dirname, '../data/ctaplusones.json');
            break;
            case 'scout':
            dataFilePath = path.join(__dirname, '../data/scoutplusones.json');
            break;
            case 'random':
            dataFilePath = path.join(__dirname, '../data/randomplusones.json');
            break;
            case 'content':
            dataFilePath = path.join(__dirname, '../data/contentplusones.json');
            break;
            case 'focus':
            dataFilePath = path.join(__dirname, '../data/focusplusones.json');
            break;
            case 'vod':
            dataFilePath = path.join(__dirname, '../data/vodplusones.json');
            break;
            case 'all':
            const filesToReset = [
                '../data/plusones.json',
                '../data/ctaplusones.json',
                '../data/contentplusones.json',
                '../data/focusplusones.json',
                '../data/vodplusones.json',
                '../data/scoutplusones.json',
                '../data/randomplusones.json'
            ];
            filesToReset.forEach(file => {
                fs.writeFile(path.join(__dirname, file), JSON.stringify({}), (err) => {
                if (err) {
                    return interaction.reply({ content: 'There was an error resetting the file.', ephemeral: true });
                }
                });
            });
            interaction.reply({ content: `All +1 files have been reset.`, ephemeral: true });
            break;
        }

        const members = await interaction.guild.members.fetch();

        if (dataFilePath) {
            fs.writeFile(dataFilePath, JSON.stringify({}), (err) => {
                if (err) {
                    return interaction.reply({ content: 'There was an error resetting the file.', ephemeral: true });
                }

                interaction.reply({ content: `The ${fileType} file has been reset.`, ephemeral: true });

            });
        } 

        members.forEach(member => {
            Plusones.updateUserName(member.id);
        });
    }
};
