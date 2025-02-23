const { ChannelType, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');

async function createTicket(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    let officer;
    let ticketofficer;
    let channel;

    if(interaction.guild.id == process.env.DISCORD_GUILD_ID && interaction.customId !== 'open_ticket_issues') {
        officer = process.env.OFFICER_ROLE_ID;
        ticketofficer = process.env.TICKET_OFFICER_ROLE_ID;

        channel = await guild.channels.create({
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
                {
                    id: officer,
                    allow: ['ViewChannel', 'SendMessages'],
                },
                {
                    id: ticketofficer,
                    allow: ['ViewChannel', 'SendMessages'],
                },
            ],
        });
    } else if (interaction.guild.id == process.env.RECRUITMENTDISCORD_GUILD_ID) {
        officer = process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID;

        channel = await guild.channels.create({
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
                {
                    id: officer,
                    allow: ['ViewChannel', 'SendMessages'],
                },
            ],
        });
    } else if(interaction.customId === 'open_ticket_issues' && interaction.guild.id == process.env.DISCORD_GUILD_ID) {
        officer = process.env.OFFICER_ROLE_ID;
        ticketofficer = process.env.TICKET_OFFICER_ROLE_ID;

        channel = await guild.channels.create({
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
                {
                    id: officer,
                    allow: ['ViewChannel', 'SendMessages'],
                },
            ],
        });
    }
    
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
    else if(interaction.customId === 'open_ticket_issues') {
        embed = new MessageEmbed()
                .setTitle('Issues & Suggestions')
                .setDescription('Thank you for opening a ticket, please follow the format written below!')
                .addFields(
                    { name: ' ', value: '- Type: \"Issue/Suggestion/Point system\"\n- Description: \"A description of your thoughts on the matter\"' }
                )
                .setColor(0xFFFF00);
    
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
    else if(interaction.customId === 'open_ticket_apply') {
        embed = new MessageEmbed()
                .setTitle('Application')
                .setDescription('A recruiter will be with you shortly.\nSend the following information while waiting for support!')
                .addFields(
                    { name: ' ', value: '- Age\n- Country\n- Active timer\n- Ingame Name\n- Stats screenshot (EU). Provide Asia / West if you played there too.\n- English level (written and spoken)\n- Do you have a vouch? Who?\n- Whats your favorite content?\n- Why are you applying to Why not?\n- How you think you can contribute to the guild?\n- Are you willing to attend mandatory content if necessary?\n- Are you aware that Worldboss isnt granted on access?\n- What PVP roles you can play? No roles = deny.\n- Are you able to record the game while playing and posting VODs on a regular basis?' }
                )
                .addFields(
                    { name: ' ', value: 'Additionally complete an IQ-Test using the /iq command in order to prove your mental capability which is required to perform good in our guild.'}
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
    else if(interaction.customId !== 'open_ticket_regear' || interaction.customId !== 'open_ticket_drama' || interaction.customId !== 'open_ticket_issues' || interaction.customId !== 'open_ticket_apply') {
        return interaction.reply({ content: 'An error occured while creating the ticket.', ephemeral: true });
    }

    channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Ticket created! ${channel.url}`, ephemeral: true });
}

module.exports = { createTicket };
