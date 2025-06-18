const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Plusones = require('../plusones.js');

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

            const matchingPlayers = searchResponse.data.players.filter(p => p.Name.toLowerCase() === ign.toLowerCase());

            if (!matchingPlayers.length) {
                await interaction.followUp({
                    content: `No player with the name "${ign}" found.`,
                    ephemeral: true,
                });
                return;
            }

            let linkedPlayer = null;
            for (const player of matchingPlayers) {
                const playerDetailsUrl = `https://gameinfo-ams.albiononline.com/api/gameinfo/players/${player.Id}`;
                const playerDetailsResponse = await axios.get(playerDetailsUrl);
                const playerData = playerDetailsResponse.data;

                if (playerData.GuildName === guildName) {
                    linkedPlayer = { ign: player.Name, playerId: player.Id };
                    break;
                }
            }

            if (!linkedPlayer) {
                await interaction.followUp({
                    content: `Player "${ign}" is not a member of "${guildName}". Link failed.`,
                    ephemeral: true,
                });
                return;
            }

            userData.discordId = discordId;
            userData.ign = linkedPlayer.ign;
            userData.playerId = linkedPlayer.playerId;
            userData.linkTime = Date.now();

            fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));

            const member = await interaction.guild.members.fetch(discordId);

            if (member.roles.cache.has(process.env.NOTLINKED_ROLE_ID)) {
                
                member.roles.remove(process.env.NOTLINKED_ROLE_ID);
                member.roles.add(process.env.WHYNOT_ROLE_ID).catch(console.error);
                member.roles.add(process.env.TRIAL_ROLE_ID).catch(console.error);
            }

            await interaction.followUp({
                content: `Your Discord account was successfully linked to "${linkedPlayer.ign}".`,
                ephemeral: true,
            });
            await member.setNickname(linkedPlayer.ign).catch(console.log("Error: Could not set nickname"));
            Plusones.updateUserName(interaction.user.id).catch(console.error);

        } catch (error) {
            console.error('Error trying to link or change nickname:', error.message);
            await interaction.followUp({
                content: 'The Albion API is not responding, please try again later.',
                ephemeral: true,
            });
        }
    },
};
