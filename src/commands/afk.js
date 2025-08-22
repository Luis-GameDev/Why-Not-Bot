const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const afkFilePath = path.join(__dirname, '../data/afkStatus.json');

function readAfkData() {
    if (!fs.existsSync(afkFilePath)) return {};
    return JSON.parse(fs.readFileSync(afkFilePath, 'utf8'));
}

function writeAfkData(data) {
    fs.writeFileSync(afkFilePath, JSON.stringify(data, null, 2));
}

function parseTime(input) {
    const match = input.match(/^(\d+)([dh])$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    return unit === 'd' ? value * 24 * 60 * 60 * 1000 : value * 60 * 60 * 1000;
}

function formatRemaining(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Manage AFK status')
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Set yourself AFK')
                .addStringOption(opt =>
                    opt.setName('reason')
                        .setDescription('Reason for being AFK')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('time')
                        .setDescription('AFK time (e.g. 2h, 3d)')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('cancel')
                .setDescription('Cancel your AFK status'))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all AFK users')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const afkData = readAfkData();
        const userId = interaction.user.id;
        const member = interaction.member;

        if (sub === 'start') {
            const reason = interaction.options.getString('reason');
            const timeStr = interaction.options.getString('time');
            const duration = parseTime(timeStr);

            if (!duration) {
                return interaction.reply({ content: 'Invalid time format. Use `h` for hours or `d` for days (e.g., `2h`, `3d`).', ephemeral: true });
            }

            const endTime = Date.now() + duration;

            afkData[userId] = {
                userId,
                username: interaction.user.tag,
                reason,
                endTime
            };

            writeAfkData(afkData);

            if (process.env.AFK_ROLE_ID) {
                await member.roles.add(process.env.AFK_ROLE_ID).catch(() => {});
            }

            await interaction.reply({ content: `You are now AFK for ${timeStr}. Reason: ${reason}`, ephemeral: true });

        } else if (sub === 'cancel') {
            if (!afkData[userId]) {
                return interaction.reply({ content: `You are not AFK.`, ephemeral: true });
            }

            delete afkData[userId];
            writeAfkData(afkData);

            if (process.env.AFK_ROLE_ID) {
                await member.roles.remove(process.env.AFK_ROLE_ID).catch(() => {});
            }

            await interaction.reply({ content: `Your AFK status has been removed.`, ephemeral: true });

        } else if (sub === 'list') {
            const entries = Object.values(afkData)
                .filter(entry => entry.endTime > Date.now())
                .sort((a, b) => a.endTime - b.endTime);

            if (entries.length === 0) {
                return interaction.reply({ content: 'No users are currently AFK.', ephemeral: true });
            }

            const embeds = [];
            for (let i = 0; i < entries.length; i += 25) {
                const embed = new EmbedBuilder()
                    .setTitle('AFK Users')
                    .setColor(0x5865F2);

                for (const entry of entries.slice(i, i + 25)) {
                    embed.addFields({
                        name: `${entry.username}`,
                        value: `**Reason:** ${entry.reason}\n**Time left:** ${formatRemaining(entry.endTime - Date.now())}`
                    });
                }

                embeds.push(embed);
            }

            await interaction.reply({ embeds, ephemeral: true });
        }
    }
};
