const { ChannelType, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

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
                .setDescription('Thank you for creating a regear ticket.\nPlease send your death screenshot along with the required information below...')
                .addFields({ name: ' ', value: '- Content \n - Caller \n - Time of Death (UTC)' })
                .setColor(0x00FF00);
        } else if (interaction.customId === 'open_ticket_drama') {
            embed = new EmbedBuilder()
                .setTitle('WB & Drama Ticket')
                .setDescription('Thank you for opening a ticket to request access for World Boss. Please send us the required information:')
                .addFields({
                    name: ' ',
                    value: '1. Being able to provide information, rat, and defend the parties in your free time.\n' +
                        '2. Screenshot on 100 spec on weapon and offhand from WB builds.\n' +
                        '3. Good English understanding and speaking to provide information from scout and be understood by the party.\n' +
                        '4. Vouch of WB Member (not mandatory).\n' +
                        '5. Willingness to rat in case it is needed. The rat presence is tracked by the guild.\n' +
                        '6. Deposit of a Caution Fee of 10 million silver.\n' +
                        '7. Willingness to do at least 50m PVE fame every 14 days.'
                })
                .setColor(0xFF0000);
        } else if (interaction.customId === 'open_ticket_issues') {
            embed = new EmbedBuilder()
                .setTitle('Issues & Suggestions')
                .setDescription('Thank you for opening a ticket, please follow the format written below!')
                .addFields({ name: ' ', value: '- Type: \"Issue/Suggestion/Point system\"\n- Description: \"A description of your thoughts on the matter\"' })
                .setColor(0xFFFF00);
        } else if (interaction.customId === 'open_ticket_apply') {
            embed = new EmbedBuilder()
                .setTitle('Application')
                .setDescription('A recruiter will be with you shortly. Send the following information while waiting for support!')
                .addFields({
                    name: ' ', value: '- Age\n- Country\n- Active timer\n- Ingame Name\n- Stats screenshot (EU). Provide Asia / West if you played there too.\n' +
                        '- English level (written and spoken)\n- Do you have a vouch? Who?\n- Whats your favorite content?\n- Why are you applying to Why not?\n' +
                        '- How do you think you can contribute to the guild?\n- Are you willing to attend mandatory content if necessary?\n- Are you aware that World Boss isn’t granted on access?\n' +
                        '- What PVP roles can you play? No roles = deny.\n- Are you able to record the game while playing and post VODs on a regular basis?'
                })
                .addFields({ name: ' ', value: 'Additionally complete an IQ-Test using the /iq command to prove your mental capability which is required to perform well in our guild.' })
                .setColor(0xFF0000);
        } else if (interaction.customId === 'open_ticket_leech') {
            embed = new EmbedBuilder()
                .setTitle('Leech Ticket')
                .setDescription('Welcome! Info about leeching will be provided soon by a Leech Officer! In the mean time, send your in game stats screenshot and your character selection screenshot!')
                .addFields({ name: 'Payment:', value: 'The average leech cost is 20mil/session, a session takes 2 hours and gives up to 80mil fame.' })
                .addFields({ name: 'Info:', value: 'You can rent any 4.4 Mobfame weapons for 2mil/session.' })
                .setColor(0xFF0000);
        } else if (interaction.customId === 'open_ticket_renting') {
            embed = new EmbedBuilder()
                .setTitle('Renting Ticket')
                .setDescription('Welcome! A Renting officer will be shortly here! In the mean time, please provide your /stats screenshot and your character selection screenshot. Thanks!')
                .setColor(0xFF0000);
        } else if (interaction.customId === 'open_ticket_diplomacy') {
            embed = new EmbedBuilder()
                .setTitle('Diplomacy Ticket')
                .setDescription('Welcome! Please describe your issue as good as possible while you wait, our officers will be shortly with you.')
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
