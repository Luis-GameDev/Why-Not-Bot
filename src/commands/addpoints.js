const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');
const Plusones = require("../plusones.js");

async function getMentionedUsersFromMessageLink(link, guild) {
    const match = link.match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
    if (!match) return [];

    const [, , channelId, messageId] = match;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased?.()) return [];

    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) return [];

    return [...message.mentions.users.values()];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add +1s to different categories')
        .addSubcommandGroup(group => group
            .setName('category')
            .setDescription('Select a category')
            .addSubcommand(sub => sub.setName('rat').setDescription('Add to rat')
                .addIntegerOption(opt => opt.setName('points').setDescription('Number of points').setRequired(true))
                .addStringOption(opt => opt.setName('date').setDescription('Date of the rat').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('User to add points to').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Message link with mentions').setRequired(false)))
            .addSubcommand(sub => sub.setName('cta').setDescription('Add to CTA')
                .addIntegerOption(opt => opt.setName('points').setDescription('Number of points').setRequired(true))
                .addUserOption(opt => opt.setName('caller').setDescription('Caller').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('User to add points to').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Message link with mentions').setRequired(false)))
            .addSubcommand(sub => sub.setName('content').setDescription('Add to content')
                .addIntegerOption(opt => opt.setName('points').setDescription('Number of points').setRequired(true))
                .addUserOption(opt => opt.setName('caller').setDescription('Caller').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('User to add points to').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Message link with mentions').setRequired(false)))
            .addSubcommand(sub => sub.setName('focus').setDescription('Add to focus')
                .addIntegerOption(opt => opt.setName('points').setDescription('Number of points').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('User to add points to').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Message link with mentions').setRequired(false)))
            .addSubcommand(sub => sub.setName('vod').setDescription('Add to VOD')
                .addIntegerOption(opt => opt.setName('points').setDescription('Number of points').setRequired(true))
                .addUserOption(opt => opt.setName('reviewer').setDescription('Reviewer').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('User to add points to').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Message link with mentions').setRequired(false)))
            .addSubcommand(sub => sub.setName('random').setDescription('Add to random')
                .addIntegerOption(opt => opt.setName('points').setDescription('Number of points').setRequired(true))
                .addStringOption(opt => opt.setName('description').setDescription('Description').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('User to add points to').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Message link with mentions').setRequired(false)))
            .addSubcommand(sub => sub.setName('negative').setDescription('Add to negative')
                .addIntegerOption(opt => opt.setName('points').setDescription('Number of points').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('User to add points to').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Message link with mentions').setRequired(false)))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const points = interaction.options.getInteger('points');
        const user = interaction.options.getUser('user');
        const messageLink = interaction.options.getString('message');

        let targets = [];
        if (messageLink) {
            targets = await getMentionedUsersFromMessageLink(messageLink, interaction.guild);
            if (targets.length === 0) return interaction.reply('No mentioned users found in the message.');
        } else if (user) {
            targets = [user];
        } else {
            return interaction.reply('You must provide either a user or a message link.');
        }

        let response = '';

        const roleCheck = (roleIds) => roleIds.some(r => interaction.member.roles.cache.has(process.env[r]));

        switch (subcommand) {
            case 'rat':
                if (!roleCheck(['OFFICER_ROLE_ID'])) return interaction.reply('You do not have permission.');
                const date = interaction.options.getString('date');
                targets.forEach(target => {
                    for (let i = 0; i < points; i++) Plusones.addRatPlus(target.id, date);
                });
                response = `Added **${points}**x +1s to ${targets.map(u => `<@${u.id}>`).join(', ')} in Rat category.`;
                break;

            case 'cta':
                if (!roleCheck(['OFFICER_ROLE_ID'])) return interaction.reply('You do not have permission.');
                const callerCTA = interaction.options.getUser('caller');
                targets.forEach(target => {
                    for (let i = 0; i < points; i++) Plusones.addCtaPlus(target.id, callerCTA.id);
                });
                response = `Added **${points}**x +1s to ${targets.map(u => `<@${u.id}>`).join(', ')} in CTA category.`;
                break;

            case 'content':
                if (!roleCheck(['OFFICER_ROLE_ID'])) return interaction.reply('You do not have permission.');
                const callerContent = interaction.options.getUser('caller');
                targets.forEach(target => {
                    for (let i = 0; i < points; i++) Plusones.addContentPlus(target.id, callerContent.id);
                });
                response = `Added **${points}**x +1s to ${targets.map(u => `<@${u.id}>`).join(', ')} in Content category.`;
                break;

            case 'focus':
                if (!roleCheck(['OFFICER_ROLE_ID', 'ECONOMY_OFFICER_ROLE_ID'])) return interaction.reply('You do not have permission.');
                targets.forEach(target => {
                    for (let i = 0; i < points; i++) Plusones.addFocusPlus(target.id);
                });
                response = `Added **${points}**x +1s to ${targets.map(u => `<@${u.id}>`).join(', ')} in Focus category.`;
                break;

            case 'vod':
                if (!roleCheck(['CONTENTCALLER_ROLE_ID', 'OFFICER_ROLE_ID', 'VODREVIEWER_ROLE_ID'])) return interaction.reply('You do not have permission.');
                const reviewer = interaction.options.getUser('reviewer');
                targets.forEach(target => {
                    for (let i = 0; i < points; i++) {
                        Plusones.addVodPlus(target.id, reviewer.id);
                        Plusones.addRandomPlus(reviewer.id, `VOD Review for ${target.username}`);
                        Plusones.addRandomPlus(reviewer.id, `VOD Review for ${target.username}`);
                    }
                });
                response = `Added **${points}**x +1s to ${targets.map(u => `<@${u.id}>`).join(', ')} in VOD category.`;
                break;

            case 'random':
                if (!roleCheck(['OFFICER_ROLE_ID', 'ECONOMY_OFFICER_ROLE_ID'])) return interaction.reply('You do not have permission.');
                const description = interaction.options.getString('description');
                targets.forEach(target => {
                    for (let i = 0; i < points; i++) Plusones.addRandomPlus(target.id, description);
                });
                response = `Added **${points}**x +1s to ${targets.map(u => `<@${u.id}>`).join(', ')} in Random category.`;
                break;

            case 'negative':
                if (!roleCheck(['OFFICER_ROLE_ID', 'WB_CALLER_ROLE_ID'])) return interaction.reply('You do not have permission.');
                const reason = interaction.options.getString('reason');
                targets.forEach(target => {
                    for (let i = 0; i < points; i++) Plusones.addNegativePlus(target.id, reason);
                });
                response = `Added **${points}**x +1s to ${targets.map(u => `<@${u.id}>`).join(', ')} in Negative category.`;
                break;
        }

        const logChannel = interaction.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
        if (logChannel) {
            const embed = new MessageEmbed()
                .setTitle(`${subcommand} points added`)
                .setDescription(`User ${interaction.user} added **${points}** points to ${targets.map(u => `<@${u.id}>`).join(', ')} in ${subcommand} category.`)
                .setTimestamp();
            logChannel.send({ embeds: [embed] });
        }

        await interaction.reply(response);
    }
};
