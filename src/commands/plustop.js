const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plustop')
        .setDescription('Lists the top members with the most +1s, including members with 0 +1s.')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Number of top members to show')
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const wbRoleId = process.env.WB_ROLE;
        const guild = interaction.guild;

        // Alle Mitglieder mit der Rolle WB_ROLE sammeln
        const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(wbRoleId));

        let memberData = [];

        // Für jedes Mitglied die +1s aus der plusones.json laden
        for (const member of membersWithRole.values()) {
            const userFilePath = path.join(__dirname, '../data/plusones.json');
            const data = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
            const plusOneCount = data[member.id] ? data[member.id].length : 0;

            memberData.push({
                user: member,
                plusOnes: plusOneCount
            });
        }

        // Sortiere die Mitglieder nach der Anzahl der +1s in absteigender Reihenfolge
        memberData.sort((a, b) => b.plusOnes - a.plusOnes);

        // Erstelle die Antwort mit den besten Mitgliedern
        let replyContent = `Top ${amount} WB Members with the most +1s:\n`;

        let count = 0;
        let embeds = [];
        let currentEmbed = {
            title: `Top ${amount} WB Members with the most +1s`,
            fields: []
        };

        // Füge die Mitglieder zum Embed hinzu
        for (const { user, plusOnes } of memberData) {
            if (count >= amount) break;

            currentEmbed.fields.push({
                name: `${user.user.tag}`,
                value: `+1s: ${plusOnes}`,
                inline: false
            });

            count++;

            // Wenn das Limit von 25 Feldern erreicht ist, erstelle ein neues Embed
            if (currentEmbed.fields.length >= 25) {
                embeds.push(currentEmbed);
                currentEmbed = {
                    title: `Top ${amount} WB Members with the most +1s (cont.)`,
                    fields: []
                };
            }
        }

        // Füge das letzte Embed hinzu, wenn es noch Daten hat
        if (currentEmbed.fields.length > 0) {
            embeds.push(currentEmbed);
        }

        // Sende die Antwort
        if (embeds.length > 1) {
            await interaction.reply({ content: replyContent, embeds });
        } else {
            await interaction.reply({ content: replyContent, embeds: [embeds[0]] });
        }
    }
};
