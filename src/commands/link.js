const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link your Discord Account to your Albion Account.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Albion Name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const discordId = interaction.user.id;
        const ign = interaction.options.getString('name');
        const userFilePath = path.join(__dirname, '../data/users/', `${discordId}.json`);
        const guildName = "WHY NOT";

        let userData = {};
        if (fs.existsSync(userFilePath)) {
            userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
            if (userData.ign) {
                await interaction.reply({
                    content: 'You are already linked to an Albion account!',
                    ephemeral: true
                });
                return;
            }
        }

        try {
            const searchUrl = `https://gameinfo-ams.albiononline.com/api/gameinfo/search?q=${ign}`;
            await interaction.reply({
                content: `Fetching Data from Albion API...`,
                ephemeral: true
            });
            const searchResponse = await axios.get(searchUrl);

            const player = searchResponse.data.players.find(p => p.Name.toLowerCase() === ign.toLowerCase());
            if (!player) {
                await interaction.followUp({
                    content: `Player with the name "${ign}" doesn't exist.`,
                    ephemeral: true,
                });
                return;
            }

            const playerId = player.Id;
            const playerDetailsUrl = `https://gameinfo-ams.albiononline.com/api/gameinfo/players/${playerId}`;
            const playerDetailsResponse = await axios.get(playerDetailsUrl);
            const playerData = playerDetailsResponse.data;

            if (playerData.GuildName !== guildName) {
                await interaction.followUp({
                    content: `You are not a member of "${guildName}". Link failed.`,
                    ephemeral: true,
                });
                return;
            }

            userData.discordId = discordId;
            userData.ign = ign;
            userData.playerId = playerId;

            fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));

            await interaction.followUp({
                content: `Your Discord account was successfully linked to "${ign}".`,
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error trying to link:', error.message);
            await interaction.followUp({
                content: 'The Albion API is not responding, please try again later.',
                ephemeral: true,
            });
        }
    },
};
