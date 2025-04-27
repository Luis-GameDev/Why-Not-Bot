const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord.js');
const Plusones = require('../plusones.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('negative')
    .setDescription('Assign negative points to users mentioned in a message link.')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Link to the message containing the mentions')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of negative points to add per user')
        .setMinValue(1)
        .setRequired(true)
    )
    .addStringOption(option =>
      option    
        .setName('reason')
        .setDescription('Reason for the negative points')
        .setRequired(true)
    ),

  async execute(interaction) {
    const messageLink = interaction.options.getString('message');
    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason');

    const requestingUser = interaction.user;
    const guild = interaction.guild;
    const member = guild.members.cache.get(requestingUser.id);
    const requiredRole = process.env.WB_CALLER_ROLE_ID;

    if (!member.roles.cache.has(requiredRole)) {
        return interaction.reply({
            content: 'You do not have permission to use this command.',
            ephemeral: true
        });
    }

    // Expect links of the form https://discord.com/channels/<guildId>/<channelId>/<messageId>
    const match = messageLink.match(/\/channels\/\d+\/(\d+)\/(\d+)$/);
    if (!match) {
      return interaction.reply({ content: 'Incorrect Message-Link-Format.', ephemeral: true });
    }
    const [, channelId, messageId] = match;

    try {
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: 'Couldnt fetch the message.', ephemeral: true });
      }

      const msg = await channel.messages.fetch(messageId);
      const users = msg.mentions.users;
      if (users.size === 0) {
        return interaction.reply({ content: 'No users mentioned in the linked message.', ephemeral: true });
      }

      users.forEach(user => {
        for (let i = 0; i < amount; i++) {
          Plusones.addNegativePlus(user.id, reason);
        }
      });

      await interaction.reply({
        content: `Gave **${amount}** negative Points to: ${users.map(u => `<@${u.id}>`).join(', ')}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error trying to execute /negative:', error);
      return interaction.reply({
        content: 'Error trying to add negative points.',
        ephemeral: true
      });
    }
  }
};
