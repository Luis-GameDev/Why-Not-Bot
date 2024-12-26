const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');
const ms = require('ms');
const fs = require('fs');
const path = require('path');

const giveawayDataFile = path.join(__dirname, '../data/giveawayData.json');
let giveawayData = {};

// Load giveaway data from file
function loadGiveawayData() {
    if (fs.existsSync(giveawayDataFile)) {
        try {
            const data = fs.readFileSync(giveawayDataFile);
            giveawayData = data.length ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error parsing giveaway data:', error);
            giveawayData = {};
        }
    }
}

// Save giveaway data to file
function saveGiveawayData() {
    fs.writeFileSync(giveawayDataFile, JSON.stringify(giveawayData, null, 2));
}

// Load the data when the bot starts
loadGiveawayData();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Giveaway commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a giveaway')
                .addStringOption(option => 
                    option.setName('message')
                        .setDescription('Message for the giveaway')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('roll')
                .setDescription('Roll the giveaway manually')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID of the giveaway')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners to draw')
                        .setRequired(true))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'start') {
            const message = interaction.options.getString('message');

            const embed = new MessageEmbed()
                .setTitle('🎉 Giveaway! 🎉')
                .setDescription(`**${message}**\n\nThe more +1s you have the higher your chances are!\nReact with 🎉 to enter!`);

            const giveawayMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

            giveawayMessage.react('🎉');

            giveawayData[giveawayMessage.id] = {
                messageId: giveawayMessage.id,
                channelId: giveawayMessage.channel.id,
                guildId: giveawayMessage.guild.id
            };

            // Save the updated giveaway data
            saveGiveawayData();

        } else if (interaction.options.getSubcommand() === 'roll') {
            const messageId = interaction.options.getString('message_id');
            const winnersCount = interaction.options.getInteger('winners');
            const plusonesWeight = 0.4; // Adjust this factor to change the impact of +1 entries

            if (!giveawayData[messageId]) {
                return interaction.reply('No active giveaway found with the provided message ID.');
            }

            const channel = await interaction.client.channels.fetch(giveawayData[messageId].channelId);
            const message = await channel.messages.fetch(giveawayData[messageId].messageId);

            const users = await message.reactions.cache.get('🎉').users.fetch();
            const participants = users.filter(user => !user.bot);

            // Load plusones data
            const plusonesDataFile = path.join(__dirname, '../data/plusones.json');
            let plusonesData = {};
            if (fs.existsSync(plusonesDataFile)) {
                try {
                    const data = fs.readFileSync(plusonesDataFile);
                    plusonesData = data.length ? JSON.parse(data) : {};
                } catch (error) {
                    console.error('Error parsing plusones data:', error);
                    plusonesData = {};
                }
            }

            // Create an array with weighted participants
            let weightedParticipants = [];
            participants.forEach(user => {
                const plusones = plusonesData[user.id] ? plusonesData[user.id].length : 0;
                const weight = 1 + Math.floor(plusones * plusonesWeight);
                console.log(`${user.username} has ${plusones} +1s and a weight of ${weight}`);
                for (let i = 0; i < weight; i++) {
                    weightedParticipants.push(user);
                }
            });

            if (weightedParticipants.length === 0) {
                return interaction.reply('No valid participants, no winners can be chosen.');
            }

            const winners = [];
            for (let i = 0; i < winnersCount; i++) {
                if (weightedParticipants.length === 0) break;
                const winner = weightedParticipants.splice(Math.floor(Math.random() * weightedParticipants.length), 1)[0];
                winners.push(winner);
            }

            if (winners.length === 0) {
                return interaction.reply('No valid participants, no winners can be chosen.');
            }

            const winnersList = winners.map(user => user.toString()).join(', ');

            interaction.reply(`Congratulations ${winnersList}! You won the giveaway!`);
        }
    },
};