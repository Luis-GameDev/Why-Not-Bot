const { ChannelType, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');

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
    
    let embed;
    let row;

    if(interaction.customId === 'open_ticket_regear') {
    embed = new MessageEmbed()
            .setTitle('Regear Ticket')
            .setDescription('Thank you for creating a regear ticket.\nPlease send your death screenshot while also the information required below...')
            .addFields(
                { name: ' ', value: '- Content \n - Caller \n - Time of Death (UTC)' }
            )
            .setColor(0x00FF00);

        row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close')
            .setStyle('Danger'),
        );
    }
    else if(interaction.customId === 'open_ticket_drama') {
        embed = new MessageEmbed()
                .setTitle('WB & Drama Ticket')
                .setDescription('Thank you for opening a ticket to request access for World Boss, please send us the required information:')
                .addFields(
                    { name: ' ', value: '- Content \n - Caller \n - Time of Death (UTC)' }
                )
                .setColor(0xFF0000);
    
            row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close')
                .setStyle('Danger'),
            );
        }
    else if(interaction.customId !== 'open_ticket_regear' || interaction.customId !== 'open_ticket_drama') {
        return interaction.reply({ content: 'An error occured while creating the ticket.', ephemeral: true });
    }

    channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Ticket created!', ephemeral: true });
}

module.exports = { createTicket };
