const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Manage the bot configuration')
    .addSubcommand(subcommand =>
      subcommand
        .setName('export')
        .setDescription('Export the current globals.js file')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('import')
        .setDescription('Import and apply a new globals.js file')
        .addAttachmentOption(option =>
          option
            .setName('file')
            .setDescription('Upload a new globals.js file')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    
    if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
        return message.reply("You do not have permission to use this command.");
    }

    const sub = interaction.options.getSubcommand();
    const globalsPath = path.join(__dirname, '..', 'globals.js');

    if (sub === 'export') {
      const file = new AttachmentBuilder(globalsPath);
      await interaction.reply({ content: 'Here is the current globals.js file, please note that when a new file is uploaded, the bot will restart:', files: [file], ephemeral: true });
    }

    else if (sub === 'import') {
      const file = interaction.options.getAttachment('file');

      if (!file.name.endsWith('.js')) {
        return interaction.reply({ content: 'Only JavaScript files (.js) are accepted.', ephemeral: true });
      }

      const newGlobalsPath = path.join(__dirname, '..', 'globals.js');
      const res = await fetch(file.url);
      const content = await res.text();

      try {
        fs.writeFileSync(newGlobalsPath, content);
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: 'Failed to write the new globals.js file.', ephemeral: true });
      }

      await interaction.reply({ content: 'Globals file updated. Restarting bot...', ephemeral: true });

      exec('pm2 restart discord-bot', (error, stdout, stderr) => {
        if (error) {
          console.error(`Restart failed: ${error.message}`);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
      });
    }
  },
};
