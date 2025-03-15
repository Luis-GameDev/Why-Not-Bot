const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('worldboss')
    .setDescription('Start the WB Party Signup process'),
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('signupModal')
      .setTitle('WB Party Signup');

    // Timer Beginn input
    const timerStartInput = new TextInputBuilder()
      .setCustomId('timerStart')
      .setLabel('Timer Beginn (UTC, z.B. 14:00)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // Timer Ende input
    const timerEndInput = new TextInputBuilder()
      .setCustomId('timerEnd')
      .setLabel('Timer Ende (UTC, z.B. 16:00)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // Friend User input (optional)
    const friendUserInput = new TextInputBuilder()
      .setCustomId('friendUser')
      .setLabel('Freund (User ID oder Mention) (optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    // Role Index input (1-10) for friend's slot
    const roleIndexInput = new TextInputBuilder()
      .setCustomId('roleIndex')
      .setLabel('Roleindex (1-10) for the friend (optional)')
      .setPlaceholder('1-10')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(timerStartInput),
      new ActionRowBuilder().addComponents(timerEndInput),
      new ActionRowBuilder().addComponents(friendUserInput),
      new ActionRowBuilder().addComponents(roleIndexInput)
    );

    await interaction.showModal(modal);
  }
};
