const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const Plusones = require("../plusones.js");
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add +1s to different categories')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rat')
                .setDescription('Add +1s to rat category')
                .addIntegerOption(option => 
                    option.setName('points')
                        .setDescription('Number of points to add')
                        .setRequired(true))
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('User to add points to')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('date')
                        .setDescription('Date of the rat')
                        .setRequired(true)))        
        .addSubcommand(subcommand =>
            subcommand
                .setName('cta')
                .setDescription('Add +1s to cta category')
                .addIntegerOption(option => 
                    option.setName('points')
                        .setDescription('Number of points to add')
                        .setRequired(true))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add points to')
                        .setRequired(true))
                .addUserOption(option => 
                    option.setName('caller')
                        .setDescription('Caller of the CTA')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('content')
                .setDescription('Add +1s to content category')
                .addIntegerOption(option => 
                    option.setName('points')
                        .setDescription('Number of points to add')
                        .setRequired(true))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add points to')
                        .setRequired(true))
                .addUserOption(option => 
                    option.setName('caller')
                        .setDescription('Caller of the Content')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('focus')
                .setDescription('Add +1s to focus category')
                .addIntegerOption(option => 
                    option.setName('points')
                        .setDescription('Number of points to add')
                        .setRequired(true))
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('User to add points to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('vod')
                .setDescription('Add +1s to VOD category')
                .addIntegerOption(option => 
                    option.setName('points')
                        .setDescription('Number of points to add')
                        .setRequired(true))
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('User to add points to')
                        .setRequired(true))
                .addUserOption(option => 
                    option.setName('reviewer')
                        .setDescription('User who reviewed the VOD')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('random')
                .setDescription('Add +1s to random category')
                .addIntegerOption(option => 
                    option.setName('points')
                        .setDescription('Number of points to add')
                        .setRequired(true))
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('User to add points to')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('description')
                        .setDescription('Description of the random +1')
                        .setRequired(true))),
    async execute(interaction) {

        if (!interaction.member.roles.cache.has(process.env.OFFICER_ROLE_ID) && interaction.options.getSubcommand() !== 'vod') {
            await interaction.reply('You do not have the required permission to use this command.');
            return;
        } else if (!interaction.member.roles.cache.has(process.env.CONTENTCALLER_ROLE_ID) && !interaction.member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !interaction.member.roles.cache.has(process.env.VODREVIEWER_ROLE_ID) && interaction.options.getSubcommand() === 'vod') {
            await interaction.reply('You do not have the required permission to use this command.');
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const points = interaction.options.getInteger('points');
        let response = '';
        const user = interaction.options.getUser('user');

        switch (subcommand) {
            case 'rat':
                response = `Added **${points}**x +1s to ${user} in Rat category.`;
                const date = interaction.options.getString('date');

                for (let i = 0; i < points; i++) {
                    Plusones.addRatPlus(user.id, date);
                }
                break;
            case 'cta':
                response = `Added **${points}**x +1s to ${user} in CTA category.`;
                const callerCTA = interaction.options.getUser('caller');
                
                for (let i = 0; i < points; i++) {
                    Plusones.addCtaPlus(user.id, callerCTA.id);
                }
                break;
            case 'random':
                response = `Added **${points}**x +1s to ${user} in Random category.`;
                const description = interaction.options.getString('description');

                for (let i = 0; i < points; i++) {
                    Plusones.addRandomPlus(user.id, description);
                }
                break;
            case 'content':
                response = `Added **${points}**x +1s to ${user} in Content category.`;
                const callerContent = interaction.options.getUser('caller');
                
                for (let i = 0; i < points; i++) {
                    Plusones.addContentPlus(user.id, callerContent.id);
                }
                break;
            case 'focus':
                response = `Added **${points}**x +1s to ${user} in Focus category.`;

                for (let i = 0; i < points; i++) {
                    Plusones.addFocusPlus(user.id);
                }
                break;
            case 'vod':
                response = `Added **${points}**x +1s to ${user} in VOD category.`;
                const reviewer = interaction.options.getUser('reviewer');

                const logChannel = interaction.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
                if (logChannel) {
                    const embed = new MessageEmbed()
                        .setTitle('VOD Points Added')
                        .setDescription(`User ${interaction.user} added **${points}** points to ${user} in VOD category, reviewed by ${reviewer}.`)
                        .setTimestamp();
                    logChannel.send({ embeds: [embed] });
                }
                
                for (let i = 0; i < points; i++) {
                    Plusones.addVodPlus(user.id, reviewer.id);
                }
                break;
        }

        await interaction.reply(response);
    },
};