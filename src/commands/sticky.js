const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const stickyPath = path.join(__dirname, '../data/stickymessages.json');

function readStickyData() {
    if (!fs.existsSync(stickyPath)) return {};
    return JSON.parse(fs.readFileSync(stickyPath, 'utf8'));
}

function writeStickyData(data) {
    fs.writeFileSync(stickyPath, JSON.stringify(data, null, 2));
}

function htmlspecialchars(str) {
return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sticky')
        .setDescription('Manage sticky messages')
        .addSubcommand(sub =>
            sub
                .setName('add')
                .setDescription('Add a sticky message')
                .addStringOption(opt =>
                    opt.setName('name').setDescription('Name of sticky message').setRequired(true))
                .addStringOption(opt =>
                    opt.setName('text').setDescription('Sticky text').setRequired(true))
                .addStringOption(opt =>
                    opt.setName('format')
                        .setDescription('Send as embed or plain text')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Embed', value: 'true' },
                            { name: 'Plain Text', value: 'false' }
                        )))
        .addSubcommand(sub =>
            sub
                .setName('remove')
                .setDescription('Remove a sticky message')
                .addStringOption(opt =>
                    opt.setName('name').setDescription('Name of sticky message').setRequired(true)))
        .addSubcommand(sub =>
            sub
                .setName('list')
                .setDescription('List all sticky messages')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        let name = interaction.options.getString('name');
        name = htmlspecialchars(name);
        const stickyData = readStickyData();

        const officerRoleId = process.env.OFFICER_ROLE_ID;
        await interaction.guild.roles.fetch(officerRoleId); 

        if (!officerRoleId || !interaction.member.roles.cache.has(officerRoleId)) {
            return interaction.reply({ content: 'Only officers can use this command', ephemeral: true });
        }

        if (sub === 'add') {
            

            // Usage:
            let text = interaction.options.getString('text');
            text = htmlspecialchars(text);
            const embedValue = interaction.options.getString('format') === 'true';
            stickyData[name] = {
                channelId: interaction.channel.id,
                text: text,
                embed: embedValue,
                messageId: null,
                lastUsed: 0
            };
            writeStickyData(stickyData);
            await interaction.reply({ content: `Sticky "${name}" added${embedValue ? ' as embed' : ''}.`, ephemeral: true });

        } else if (sub === 'remove') {
            if (!stickyData[name]) {
                return interaction.reply({ content: `Sticky "${name}" does not exist.`, ephemeral: true });
            }
            delete stickyData[name];
            writeStickyData(stickyData);
            await interaction.reply({ content: `Sticky "${name}" removed.`, ephemeral: true });

        } else if (sub === 'list') {
            const entries = Object.entries(stickyData);
            if (entries.length === 0) {
                return interaction.reply({ content: 'There are no sticky messages configured.', ephemeral: true });
            }

            const ITEMS_PER_PAGE = 5;
            const pages = Math.ceil(entries.length / ITEMS_PER_PAGE);

            const generateEmbed = (page) => {
                const embed = new EmbedBuilder()
                    .setTitle(`📌 Sticky Messages (Page ${page + 1}/${pages})`)
                    .setColor(0xfcd34d);

                const slice = entries.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
                for (const [name, entry] of slice) {
                    const shortText = entry.text.length > 100 ? entry.text.slice(0, 100) + '…' : entry.text;
                    embed.addFields({
                        name: `• ${name}`,
                        value: `Channel: <#${entry.channelId}>
Embed: ${entry.embed ? 'Yes' : 'No'}
Text: ${shortText}`
                    });
                }
                return embed;
            };

            let currentPage = 0;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('◀️ Prev').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('next').setLabel('Next ▶️').setStyle(ButtonStyle.Primary)
            );

            const msg = await interaction.reply({
                embeds: [generateEmbed(currentPage)],
                components: [row],
                ephemeral: true,
                fetchReply: true
            });

            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120000
            });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) return i.reply({ content: 'Only the command user can interact with this.', ephemeral: true });

                if (i.customId === 'prev') {
                    currentPage = currentPage === 0 ? pages - 1 : currentPage - 1;
                } else if (i.customId === 'next') {
                    currentPage = currentPage === pages - 1 ? 0 : currentPage + 1;
                }

                await i.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [row]
                });
            });

            collector.on('end', () => {
                if (!msg.editable) return;
                msg.edit({ components: [] }).catch(() => {});
            });
        }
    }
};
