const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plusdelete')
        .setDescription('Delete entries from the JSON file')
        .addUserOption(option => 
            option.setName('member')
                .setDescription('The user or @everyone')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose the type of +1 to delete')
                .setRequired(true)
                .addChoices(
                    { name: 'rat', value: 'rat' },
                    { name: 'content', value: 'content' },
                    { name: 'cta', value: 'cta' },
                    { name: 'focus', value: 'focus' },
                    { name: 'vod', value: 'vod' },
                    { name: 'scout', value: 'scout' },
                    { name: 'random', value: 'random' }
                )
        )
        .addStringOption(option => 
            option.setName('index')
                .setDescription('Index of the entry or "all" for all')
                .setRequired(false)),

    async execute(interaction) {
        let member = interaction.options.getUser('member');
        member = member.id
        let index = interaction.options.getString('index');
        const type = interaction.options.getString('type');
        let filePath;

        switch (type) {   
            case 'rat':
                filePath = path.join(__dirname, '../data/plusones.json');
                break;
            case 'content':
                filePath = path.join(__dirname, '../data/contentplusones.json');
                break;
            case 'cta':
                filePath = path.join(__dirname, '../data/ctaplusones.json');
                break;
            case 'focus':
                filePath = path.join(__dirname, '../data/focusplusones.json');
                break;
            case 'vod':
                filePath = path.join(__dirname, '../data/vodplusones.json');
                break;
            case 'scout':
                filePath = path.join(__dirname, '../data/scoutplusones.json');
                break;
            case 'random':
                filePath = path.join(__dirname, '../data/randomplusones.json');
                break;
        }

        // check for perms
        const sender = interaction.guild.members.cache.get(interaction.user.id);
        if(!sender.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
            return interaction.reply({ content: 'Only officers can remove +1s.', ephemeral: true });
        }

        if (!fs.existsSync(filePath)) {
            return interaction.reply({ content: 'The file does not exist.', ephemeral: true });
        }

        const rawData = fs.readFileSync(filePath);
        let data;

        try {
            data = JSON.parse(rawData);
        } catch (error) {
            return interaction.reply({ content: 'The JSON file is corrupted.', ephemeral: true });
        }

        /*if (member === process.env.DISCORD_APPLICATION_ID) {
            const ratRole = interaction.guild.roles.cache.get(process.env.RAT_ROLE_ID);
            const membersWithRatRole = ratRole.members;

            membersWithRatRole.forEach(member => {
                const userId = member.id;
                if (data[userId] && data[userId].length >= 15) {
                    return;
                }
                member.roles.remove(process.env.RAT_ROLE_ID).catch(console.error);
            });
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
            return interaction.reply('The file has been successfully reset.');
        } */

        if (!data[member]) {
            return interaction.reply({ content: `The user <@${member}> does not exist in the file.`, ephemeral: true });
        }

        if (index === 'all') {
            delete data[member];
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return interaction.reply(`The user <@${member}> has been successfully removed.`);
        } 

        if (index) {
            const parsedIndex = parseInt(index, 10)-1;

            if (isNaN(parsedIndex) || parsedIndex < 1 || parsedIndex > data[member].length) {
                return interaction.reply({ content: 'The specified index is invalid.', ephemeral: true });
            }

            data[member].splice(parsedIndex, 1);

            if (data[member].length === 0) {
                delete data[member];
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return interaction.reply(`Entry ${index} of the user <@${member}> has been successfully removed.`);
        }

        return interaction.reply({ content: 'Invalid options. Please check the command.', ephemeral: true });
    }
};
