const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Plusones = require('../plusones.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('attendancecheck')
    .setDescription('List users who did not meet attendance requirements.')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Which category to check')
        .setRequired(true)
        .addChoices(
            { name: 'Rat', value: 'rat' },
            { name: 'CTA', value: 'cta' },
            { name: 'Content', value: 'content' },
            { name: 'VOD', value: 'vod' },
            { name: 'Focus', value: 'focus' },
            { name: 'Scout', value: 'scout' },
            { name: 'Negative', value: 'negative' },
            { name: 'Random', value: 'random' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('days')
        .setDescription('Look back this many days')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Minimum required points')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;

    if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
      return interaction.reply("You do not have permission to use this command.");
    }

    const type = interaction.options.getString('type');
    const days = interaction.options.getInteger('days');
    const amount = interaction.options.getInteger('amount');

    await interaction.deferReply();  // defer the reply to avoid interaction timeout

    await interaction.guild.members.fetch();
    const members = interaction.guild.members.cache.filter(m => !m.user.bot);

    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const notMet = [];
    for (const member of members.values()) {
        let entries = [];
        if (type === 'rat') entries = Plusones.getRatPlus(member.id);
        if (type === 'cta') entries = Plusones.getCtaPlus(member.id);
        if (type === 'content') entries = Plusones.getContentPlus(member.id);
        if (type === 'vod') entries = Plusones.getVodPlus(member.id);
        if (type === 'focus') entries = Plusones.getFocusPlus(member.id);
        if (type === 'scout') entries = Plusones.getScoutPlus(member.id);
        if (type === 'negative') entries = Plusones.getNegativePlus(member.id);
        if (type === 'random') entries = Plusones.getRandomPlus(member.id);

        const recentCount = entries.filter(e => e.time >= cutoff).length;
        if (recentCount < amount) {
          notMet.push({ member, recentCount });
        }
    }

    if (notMet.length === 0) {
      return interaction.editReply(`✅ All users have at least ${amount} ${type} points in the last ${days} days.`);
    }

    // Build the embed with all users in one field, split if too large
    const embed = new EmbedBuilder()
      .setTitle(`Users with less than ${amount} ${type} points in the past ${days}d`)
      .setColor(0xFF0000);

    let userList = "";
    notMet.forEach(({ member, recentCount }) => {
      userList += `${member.user.tag}: Points: ${recentCount}\n`;
    });

    // Check if the userList exceeds the 1024 character limit
    const maxLength = 1024;
    if (userList.length > maxLength) {
      const chunks = [];
      while (userList.length > 0) {
        const chunk = userList.slice(0, maxLength);  // slice up to 1024 characters
        chunks.push(chunk);
        userList = userList.slice(chunk.length);  // reduce userList for next chunk
      }

      // Send multiple embeds if the list is too large
      const embeds = [];
      chunks.forEach((chunk, index) => {
        const embedChunk = new EmbedBuilder()
          .setTitle(`Users with less than ${amount} ${type} points in the past ${days}d`)
          .setColor(0xFF0000)
          .addFields({
            name: `Users (Part ${index + 1})`,
            value: chunk,
            inline: false
          });
        embeds.push(embedChunk);
      });

      return interaction.editReply({ embeds });
    } else {
      // If the list fits within the limit, send it as one embed
      embed.addFields({
        name: "Users",
        value: userList || "No users found.",
        inline: false
      });
      return interaction.editReply({ embeds: [embed] });
    }
  }
};
