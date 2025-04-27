const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/users.json');

function loadUserData() {
    return fs.existsSync(dataFilePath)
        ? JSON.parse(fs.readFileSync(dataFilePath, 'utf8'))
        : {};
}

function ensureVouchStructure(userData, userId) {
    if (!userData[userId]) userData[userId] = {};
    if (!userData[userId].vouches) userData[userId].vouches = { received: [], given: [] };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vouchlist')
        .setDescription('View vouches of a member')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose "given" or "received"')
                .setRequired(true)
                .addChoices(
                    { name: 'given', value: 'given' },
                    { name: 'received', value: 'received' }
                )
        )
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to view vouches for')
                .setRequired(false)
        ),
    async execute(interaction) {
        const userData = loadUserData();
        const type = interaction.options.getString('type');
        const targetUser = interaction.options.getUser('member') || interaction.user;
        const targetId = targetUser.id;

        ensureVouchStructure(userData, targetId);

        const vouches = userData[targetId].vouches[type] || [];

        if (vouches.length === 0) {
            return interaction.reply({
                content: `<@${targetId}> has no ${type} vouches.`,
                ephemeral: true
            });
        }

        const vouchList = vouches.map(uid => `<@${uid}>`).join('\n');
        return interaction.reply({
            embeds: [{
                title: `${type.charAt(0).toUpperCase() + type.slice(1)} Vouches for ${targetUser.username}`,
                description: vouchList,
                color: 0x00FF00
            }]
        });
    }
};
