const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Unlink a user from their IGN.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unlink')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const requestingUser = interaction.user;
        const guild = interaction.guild;
        const member = guild.members.cache.get(requestingUser.id);
        const requiredRole = process.env.OFFICER_ROLE_ID;

        if (!member.roles.cache.has(requiredRole)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const filePath = path.join(__dirname, '../data/users', `${targetUser.id}.json`);
        if (!fs.existsSync(filePath)) {
            return interaction.reply({
                content: `No data found for ${targetUser.tag}.`,
                ephemeral: true
            });
        }

        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!userData.ign) {
            return interaction.reply({
                content: `${targetUser.tag} is not linked to any IGN.`,
                ephemeral: true
            });
        }

        delete userData.ign;
        fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

        return interaction.reply({
            content: `${targetUser} was successfully unlinked from their IGN.`,
            ephemeral: false
        });
    },
};
