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
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose "rat" or "cta"')
                .setRequired(true)
                .addChoices(
                    { name: 'rat', value: 'rat' },
                    { name: 'cta', value: 'cta' }
                )
        ),

    async execute(interaction) {
        if(interaction.options.getString('type') === 'rat') {
            const amount = interaction.options.getInteger('amount');
            const wbRoleId = process.env.WB_ROLE;
            const guild = interaction.guild;

            const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(wbRoleId));

            let memberData = [];

            for (const member of membersWithRole.values()) {
                const userFilePath = path.join(__dirname, '../data/plusones.json');
                const data = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
                const plusOneCount = data[member.id] ? data[member.id].length : 0;

                memberData.push({
                    user: member,
                    plusOnes: plusOneCount
                });
            }

            memberData.sort((a, b) => b.plusOnes - a.plusOnes);

            let replyContent = `Top ${amount} WB Members with the most +1s:\n`;

            let count = 0;
            let embeds = [];
            let currentEmbed = {
                title: `Top ${amount} WB Members with the most +1s`,
                fields: []
            };

            for (const { user, plusOnes } of memberData) {
                if (count >= amount) break;

                currentEmbed.fields.push({
                    name: `${user.user.tag}`,
                    value: `+1s: ${plusOnes}`,
                    inline: false
                });

                count++;

                if (currentEmbed.fields.length >= 25) {
                    embeds.push(currentEmbed);
                    currentEmbed = {
                        title: `Top ${amount} WB Members with the most +1s (cont.)`,
                        fields: []
                    };
                }
            }

            if (currentEmbed.fields.length > 0) {
                embeds.push(currentEmbed);
            }

            if (embeds.length > 1) {
                await interaction.reply({ content: replyContent, embeds });
            } else {
                await interaction.reply({ content: replyContent, embeds: [embeds[0]] });
            }
        }

        if(interaction.options.getString('type') === 'cta') {
            const amount = interaction.options.getInteger('amount');
            const guild = interaction.guild;

            const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(wbRoleId));

            let memberData = [];

            for (const member of membersWithRole.values()) {
                const userFilePath = path.join(__dirname, '../data/plusones.json');
                const data = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
                const plusOneCount = data[member.id] ? data[member.id].length : 0;

                memberData.push({
                    user: member,
                    plusOnes: plusOneCount
                });
            }

            memberData.sort((a, b) => b.plusOnes - a.plusOnes);

            let replyContent = `Top ${amount} WB Members with the most +1s:\n`;

            let count = 0;
            let embeds = [];
            let currentEmbed = {
                title: `Top ${amount} WB Members with the most +1s`,
                fields: []
            };

            for (const { user, plusOnes } of memberData) {
                if (count >= amount) break;

                currentEmbed.fields.push({
                    name: `${user.user.tag}`,
                    value: `+1s: ${plusOnes}`,
                    inline: false
                });

                count++;

                if (currentEmbed.fields.length >= 25) {
                    embeds.push(currentEmbed);
                    currentEmbed = {
                        title: `Top ${amount} WB Members with the most +1s (cont.)`,
                        fields: []
                    };
                }
            }

            if (currentEmbed.fields.length > 0) {
                embeds.push(currentEmbed);
            }

            if (embeds.length > 1) {
                await interaction.reply({ content: replyContent, embeds });
            } else {
                await interaction.reply({ content: replyContent, embeds: [embeds[0]] });
            }
        }
    }
};
