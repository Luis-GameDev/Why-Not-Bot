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
        .setName('removevouch')
        .setDescription('Remove a vouch you previously gave to another member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to remove the vouch from')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userData = loadUserData();
        const targetUser = interaction.options.getUser('member');
        const targetId = targetUser.id;
        const executorId = interaction.user.id;

        if (targetId === executorId) {
            return interaction.reply({ content: "You cannot remove a vouch for yourself.", ephemeral: true });
        }

        ensureVouchStructure(userData, executorId);
        ensureVouchStructure(userData, targetId);

        const givenVouches = userData[executorId].vouches.given;
        const receivedVouches = userData[targetId].vouches.received;

        if (!givenVouches.includes(targetId)) {
            return interaction.reply({ content: `You have not vouched for <@${targetId}>.`, ephemeral: true });
        }

        userData[executorId].vouches.given = givenVouches.filter(uid => uid !== targetId);
        userData[targetId].vouches.received = receivedVouches.filter(uid => uid !== executorId);

        saveUserData(userData);

        return interaction.reply({
            content: `Your vouch for <@${targetId}> has been removed.`,
            ephemeral: true
        });
    }
};
