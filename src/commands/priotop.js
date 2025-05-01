const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Plusones = require('../plusones.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('priotop')
    .setDescription('Show top prio points')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of top users to show')
        .setRequired(true)
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    await interaction.guild.members.fetch();
    const entries = interaction.guild.members.cache.map(member => member.user.id);
    const results = await Promise.all(entries.map(async id => {
      const points = await Plusones.getUserPrio(id) || 0;
      return { id, points };
    }));
    results.sort((a, b) => b.points - a.points);
    const top = results.slice(0, amount);
    const embeds = [];
    for (let i = 0; i < top.length; i += 25) {
      const chunk = top.slice(i, i + 25);
      const embed = new EmbedBuilder()
        .setTitle(`Top Prio Points ${i + 1}-${i + chunk.length}`)
        .setColor(0x00AAFF);
      chunk.forEach((user, idx) => {
        embed.addFields({ name: `#${i + idx + 1}`, value: `<@${user.id}>: ${user.points} points`, inline: false });
      });
      embeds.push(embed);
    }
    await interaction.reply({ embeds, ephemeral: false });
  }
};
