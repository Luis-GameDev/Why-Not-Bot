const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/plusones.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plusedit')
        .setDescription('Edit a +1 rat entry of a user.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member whose +1 entry you want to edit')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('The index of the +1 entry you want to edit')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('newdate')
                .setDescription('The new date you want to set for the +1 entry')
                .setRequired(true)
        ),
    async execute(interaction) {
        const memberId = interaction.options.getUser('member').id;
        const index = interaction.options.getInteger('index') -1;
        const newDate = interaction.options.getString('newdate');
        const discordId = interaction.user.id;

        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        if (!data[memberId]) {
            return interaction.reply({
                content: `No +1 entries found for <@${memberId}>.`,
                ephemeral: true,
            });
        }

        if (index < 0 || index >= data[memberId].length+1) {
            return interaction.reply({
                content: 'Invalid index. Please provide a valid index.',
                ephemeral: true,
            });
        }

        const memberHasRole = interaction.member.roles.cache.has(process.env.OFFICER_ROLE_ID); 
        if (discordId !== memberId && !memberHasRole) {
            return interaction.reply({
                content: 'You do not have permission to edit this users +1 entry.',
                ephemeral: true,
            });
        }

        data[memberId][index].date = newDate;

        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

        return interaction.reply({
            content: `Successfully updated the +1 entry of <@${memberId}> at index ${index+1} to "${newDate}".`,
            ephemeral: true,
        });
    },
};
