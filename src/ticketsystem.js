const { ChannelType, ActionRowBuilder, ButtonBuilder } = require('discord.js');

async function createTicket(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    const channel = await guild.channels.create({
        name: `ticket-${member.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: ['ViewChannel'],
            },
            {
                id: member.id,
                allow: ['ViewChannel', 'SendMessages'],
            },
        ],
    });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setStyle('Danger')
        );

    await channel.send({ content: `Hello ${member.user.username}, how can we assist you today?`, components: [row] });
    await interaction.reply({ content: 'Ticket created!', ephemeral: true });
}

module.exports = { createTicket };
