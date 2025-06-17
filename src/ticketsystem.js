const { ChannelType, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const GLOBALS = require('./globals.js');

async function createTicket(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;
    const supportChannel = interaction.channel; 

    let officer, ticketofficer;
    let thread;

    if (interaction.guild.id == process.env.DISCORD_GUILD_ID && interaction.customId !== 'open_ticket_issues') {
        officer = process.env.OFFICER_ROLE_ID;
        ticketofficer = process.env.TICKET_OFFICER_ROLE_ID;
    } else if (interaction.guild.id == process.env.RECRUITMENTDISCORD_GUILD_ID) {
        officer = process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID;
    } else if (interaction.customId === 'open_ticket_issues' && interaction.guild.id == process.env.DISCORD_GUILD_ID) {
        officer = process.env.OFFICER_ROLE_ID;
        ticketofficer = process.env.TICKET_OFFICER_ROLE_ID;
    }

    try {
        thread = await supportChannel.threads.create({
            name: `ticket-${member.user.username}`,
            autoArchiveDuration: 10080, // 7 days
            type: ChannelType.PrivateThread,
            reason: 'User created a ticket'
        });

        //await thread.members.add(member.id);
        let addingMessage = await thread.send({ content: `<@${member.id}> <@&${officer}> <@&${ticketofficer}>` });
        await addingMessage.delete();

        let embed;
        let row;

        if (interaction.customId === 'open_ticket_regear') {
            embed = new EmbedBuilder()
                .setTitle('Regear Ticket')
                .setDescription(GLOBALS.RegearTicketPanelDescription)
                .addFields({ name: ' ', value: GLOBALS.RegearTicketMessage})
                .setColor(0x00FF00);
        } else if (interaction.customId === 'open_ticket_drama') {
            embed = new EmbedBuilder()
                .setTitle('Worldboss Ticket')
                .setDescription(GLOBALS.WorldbossTicketMessageDescription)
                .addFields({ name: ' ', value: GLOBALS.WorldbossTicketMessage})
                .setColor(0xFF0000);
        } else if (interaction.customId === 'open_ticket_issues') {
            embed = new EmbedBuilder()
                .setTitle('Issues & Suggestions')
                .setDescription(GLOBALS.IssuesTicketMessageDescription)
                .addFields({ name: ' ', value: GLOBALS.IssuesTicketMessage })
                .setColor(0xFFFF00);
        } else if (interaction.customId === 'open_ticket_apply') {
            embed = new EmbedBuilder()
                .setTitle('Application')
                .setDescription(GLOBALS.ApplicationTicketMessageDescription)
                .addFields({
                    name: ' ', value: GLOBALS.ApplicationTicketMessage })
                .addFields({ name: ' ', value: GLOBALS.ApplicationTicketMessage2 })
                .setColor(0xFF0000);
        } else if (interaction.customId === 'open_ticket_leech') {
            embed = new EmbedBuilder()
                .setTitle('Leech Ticket')
                .setDescription(GLOBALS.LeechTicketMessageDescription)
                .addFields({ name: 'Payment:', value: GLOBALS.LeechTicketMessage1 })
                .addFields({ name: 'Info:', value: GLOBALS.LeechTicketMessage2 })
                .setColor(0xFF0000);
        } else if (interaction.customId === 'open_ticket_renting') {
            embed = new EmbedBuilder()
                .setTitle('Renting Ticket')
                .setDescription(GLOBALS.RentingTicketMessage)
                .setColor(0xFF0000);
        } else if (interaction.customId === 'open_ticket_diplomacy') {
            embed = new EmbedBuilder()
                .setTitle('Diplomacy Ticket')
                .setDescription(GLOBALS.DiplomacyTicketMessage)
                .setColor(0x0000FF);
        } else {
            return interaction.editReply({ content: 'An error occurred while creating the ticket.', ephemeral: true });
        }

        row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setStyle('Danger'), 
                new ButtonBuilder()
                    .setCustomId('delete_ticket')
                    .setLabel('Delete')
                    .setStyle('Danger') 
            );

        await thread.send({ embeds: [embed], components: [row] });

        await interaction.editReply({ content: `Ticket created! ${thread.url}`, ephemeral: true });

    } catch (error) {
        console.error('Error creating ticket:', error);
        return interaction.editReply({ content: 'Failed to create a ticket. Please try again later.', ephemeral: true });
    }
}

module.exports = { createTicket };
