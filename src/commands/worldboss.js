const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('worldboss')
    .setDescription('Start the WB Party Signup process'),
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('signupModal')
      .setTitle('WB Party Signup');

    const timerStartInput = new TextInputBuilder()
      .setCustomId('timerStart')
      .setLabel('Timer Start (UTC, e.g. 14:00)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const timerEndInput = new TextInputBuilder()
      .setCustomId('timerEnd')
      .setLabel('Timer End (UTC, e.g. 16:00)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const friendUserInput = new TextInputBuilder()
      .setCustomId('friendUser')
      .setLabel('Friend (User ID) (optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const roleIndexInput = new TextInputBuilder()
      .setCustomId('roleIndex')
      .setLabel('Roleindex (2-10) for the friend (optional)')
      .setPlaceholder('2-10')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(timerStartInput),
      new ActionRowBuilder().addComponents(timerEndInput),
      new ActionRowBuilder().addComponents(friendUserInput),
      new ActionRowBuilder().addComponents(roleIndexInput)
    );
    
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

    if (interaction.channel.id !== process.env.WB_CALL_CHANNEL_ID) {
      return interaction.reply({
        content: 'This command can only be used in the WB-Call channel.',
        ephemeral: true
    });
    }

    await interaction.showModal(modal);
  }
};
