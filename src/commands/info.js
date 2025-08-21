const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Plusones = require("../plusones.js");
const fs = require("fs");
const path = require('path');

function msToTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about a user.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member you want to get information about.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const member = interaction.options.getMember("member")
        const avatar = member.user.displayAvatarURL({ dynamic: true })

        const filePath = path.join(__dirname, '../data/users', `${member.id}.json`);

        let userData;
        if (fs.existsSync(filePath)) {
            userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
            userData = { ign: undefined, voicetime: { total: 0, sessions: [] } };
        }

        const userIgn = userData.ign === undefined ? "Not Linked" : `IGN - ${userData.ign}`;

        const totalVoice = userData.voicetime?.total || 0;
        const thisMonthSessions = (userData.voicetime?.sessions || []).filter(s => {
            const joinDate = new Date(s.join);
            const now = new Date();
            return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
        });

        const monthlyVoice = thisMonthSessions.reduce((acc, s) => acc + (s.leave - s.join), 0);

        interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle(`${member.user.username}\`s Infocard`)
                .addFields([
                    {
                        name: `Account created at:`,
                        value: `<t:${Math.round(member.user.createdTimestamp / 1000)}>`,
                    },
                    {
                        name: `Joined server at:`,
                        value: `<t:${Math.round(member.joinedTimestamp / 1000)}>`,
                        inline: true
                    },
                    {
                        name: "User ID:",
                        value: member.user.id,
                    },
                    {
                        name: "+1s:",
                        value: `Rat: ${Plusones.getRatPlus(member.id).length} 
                        Cta: ${Plusones.getCtaPlus(member.id).length} 
                        Content: ${Plusones.getContentPlus(member.id).length} 
                        Focus: ${Plusones.getFocusPlus(member.id).length} 
                        VOD: ${Plusones.getVodPlus(member.id).length} 
                        Scout: ${Plusones.getScoutPlus(member.id).length} 
                        Random: ${Plusones.getRandomPlus(member.id).length}

                        Negative: ${Plusones.getNegativePlus(member.id).length}

                        Total +1s: ${Plusones.getRatPlus(member.id).length + Plusones.getCtaPlus(member.id).length + Plusones.getContentPlus(member.id).length + Plusones.getFocusPlus(member.id).length + Plusones.getVodPlus(member.id).length + Plusones.getScoutPlus(member.id).length + Plusones.getRandomPlus(member.id).length}
                        Prio: ${await Plusones.getUserPrio(member.id)}`,
                    },
                    {
                        name: "Voice Activity:",
                        value: `Past 30d: ${msToTime(monthlyVoice)}\nTotal: ${msToTime(totalVoice)}`,
                    },
                    {
                        name: "Link:",
                        value: `${userIgn}`
                    },
                    {
                        name: `Roles:`,
                        value: member.roles.cache
                            .filter(role => role.name !== '@everyone')
                            .map(role => `<@&${role.id}>`)
                            .join(" ") || "-",
                        inline: false
                    },
                    {
                        name: "Avatar:",
                        value: " "
                    }
                ])
                .setImage(avatar)
                .setColor(0)
        ] });
    }
};
