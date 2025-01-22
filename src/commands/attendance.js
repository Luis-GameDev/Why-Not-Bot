const { SlashCommandBuilder } = require('@discordjs/builders');
const path = require("path");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('attendance')
        .setDescription('Tracks every user within your voice channel.'),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(process.env.CONTENTCALLER_ROLE_ID)) {
            await interaction.reply('You do not have the required permission to use this command.');
            return;
        }

        const channel = interaction.member.voice.channel;

        if (!channel) {
            await interaction.reply('You need to be in a voice channel to use this command.');
            return;
        }

        const members = channel.members;
        

        // adding +1 logic
        const dataFilePath = path.join(__dirname, '../data/ctaplusones.json');
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        let time = new Date().getTime();
        let caller = interaction.user.id;
        
        members.forEach(member => {
            let discordId = member.id;

            if (!data[discordId]) {
                data[discordId] = [];
            }
        
            data[discordId].push({ time, caller });
        })

        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

        await interaction.reply(`Tracked attendance for ${members.size} Members in your Voice Channel.`);
    },
};
