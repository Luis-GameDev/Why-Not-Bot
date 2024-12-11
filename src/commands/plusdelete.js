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
            option.setName('index')
                .setDescription('Index of the entry or "all" for all')
                .setRequired(false)),

    async execute(interaction) {
        let member = interaction.options.getUser('member');
        member = member.id
        let index = interaction.options.getString('index');
        const filePath = path.join(__dirname, '../data/plusones.json');

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

        if (member === '1314916459670929529') {
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
            return interaction.reply('The file has been successfully reset.');
        } 

        if (!data[member]) {
            return interaction.reply({ content: `The user <@${member}> does not exist in the file.`, ephemeral: true });
        }

        if (index === 'all') {
            delete data[member];
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return interaction.reply(`The user <@${member}> has been successfully removed.`);
        } 

        if (index) {
            const parsedIndex = parseInt(index, 10) +1;

            if (isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= data[member].length) {
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
