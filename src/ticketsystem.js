const { ChannelType, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');

async function createTicket(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    const channel = await guild.channels.create({
        name: `ticket-${member.user.username}`,
        type: ChannelType.GuildText,
        parent: interaction.channel.parentId,
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
                new ButtonBuilder()
                .setCustomId('delete_ticket')
                .setLabel('Delete')
                .setStyle('Danger'),
            );
    }
    else if(interaction.customId === 'open_ticket_drama') {
        embed = new MessageEmbed()
                .setTitle('WB & Drama Ticket')
                .setDescription('Thank you for opening a ticket to request access for World Boss, please send us the required information:')
                .addFields(
                    { name: ' ', value: '1. Ability to have and use scout\n2. Screenshot on 100 spec on weapon and offhand from WB builds\n3. Good english understanding and speaking in order to provide information from scout and be understood by the party\n4. Vouch of WB Member (not mandatory)\n5. Willing to rat in case its needed. The rat presence is tracked by the guild\n6. Deposit of a Cautional Fee of 10 million silver\n7. Willingness to do at least 50m PVE fame each 14 days' }
                )
                .setColor(0xFF0000);
    
            row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close')
                .setStyle('Danger'),
                new ButtonBuilder()
                .setCustomId('delete_ticket')
                .setLabel('Delete')
                .setStyle('Danger'),
            );
        }
    else if(interaction.customId !== 'open_ticket_regear' || interaction.customId !== 'open_ticket_drama') {
        return interaction.reply({ content: 'An error occured while creating the ticket.', ephemeral: true });
    }

    channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Ticket created! ${channel.url}`, ephemeral: true });
}

module.exports = { createTicket };
