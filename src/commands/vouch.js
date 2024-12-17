const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/users.json');

function loadUserData() {
    return fs.existsSync(dataFilePath)
        ? JSON.parse(fs.readFileSync(dataFilePath, 'utf8'))
        : {};
}

function saveUserData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

function ensureVouchStructure(userData, userId) {
    if (!userData[userId]) userData[userId] = {};
    if (!userData[userId].vouches) userData[userId].vouches = { received: [], given: [] };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vouch')
        .setDescription('Vouch for another member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to vouch for')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userData = loadUserData();
        const targetUser = interaction.options.getUser('member');
        const targetId = targetUser.id;
        const executorId = interaction.user.id;

        if (!interaction.member.roles.cache.has(process.env.WB_ROLE)) {
            return interaction.reply({ content: "Only WB-Members can vouch!", ephemeral: true });
        }

        if (targetId === executorId) {
            return interaction.reply({ content: "You cant vouch for yourself!", ephemeral: true });
        }

        ensureVouchStructure(userData, executorId);
        ensureVouchStructure(userData, targetId);

        if (userData[executorId].vouches.given.includes(targetId)) {
            return interaction.reply({ content: `You have already vouched for <@${targetId}>.`, ephemeral: true });
        }

        userData[executorId].vouches.given.push(targetId);
        userData[targetId].vouches.received.push(executorId);

        saveUserData(userData);

        return interaction.reply({
            content: `You successfully vouched for <@${targetId}>.`,
            ephemeral: true
        });
    }
};
