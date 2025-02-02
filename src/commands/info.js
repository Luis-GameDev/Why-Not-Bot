const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Plusones = require("../plusones.js");
const fs = require("fs");
const path = require('path');


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
            const avatar = member.user.displayAvatarURL({dynamic: true})

            const filePath = path.join(__dirname, '../data/users', `${member.id}.json`);

            let userData;
            if (fs.existsSync(filePath)) {
                userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } else {
                userData = {ign: undefined};
            }
            const userIgn = userData.ign === undefined ? "Not Linked" : `IGN - ${userData.ign}`

            interaction.reply({embeds: [
                new EmbedBuilder()
                .setTitle(`${member.user.username}\`s Infocard`)
                .addFields([
                    {
                        name: `Account created at:`,
                        value: `<t:${Math.round(member.user.createdTimestamp/1000)}>`,
                    },
                    {
                        name: `Joined server at:`,
                        value: `<t:${Math.round(member.joinedTimestamp/1000)}>`,
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
                        Total: ${Plusones.getRatPlus(member.id).length + Plusones.getCtaPlus(member.id).length + Plusones.getContentPlus(member.id).length + Plusones.getFocusPlus(member.id).length + Plusones.getVodPlus(member.id).length + Plusones.getScoutPlus(member.id).length}`
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
            ]})
        }
}