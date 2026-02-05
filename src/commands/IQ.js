const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const questions = require('../iqQuestions');
const index = require('../index.js');

const dataPath = path.join(__dirname, '../data/iqtest.json');
const sessionPath = path.join(__dirname, '../data/iqsessions.json');

function loadResults() {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveResults(results) {
  fs.writeFileSync(dataPath, JSON.stringify(results, null, 2));
}

function loadSessions() {
  try {
    const data = fs.readFileSync(sessionPath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  fs.writeFileSync(sessionPath, JSON.stringify(sessions, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iq')
    .setDescription('Take a quick IQ test to assess basic skills.'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      let currentQuestion = 0;
      const total = questions.length;

      const createQuestionEmbed = () => {
        const q = questions[currentQuestion];
        return new EmbedBuilder()
          .setTitle(`Question ${currentQuestion + 1}/${total}`)
          .setDescription(q.question)
          .setColor(0x1e90ff);
      };

      const createButtonsRow = () => {
        const q = questions[currentQuestion];
        const row = new ActionRowBuilder();
        q.choices.forEach((choice, index) => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`iq_choice_${index}`)
              .setLabel(choice)
              .setStyle('Primary')
          );
        });
        return row;
      };

      const message = await interaction.editReply({
        embeds: [createQuestionEmbed()],
        components: [createButtonsRow()],
        fetchReply: true
      });

      const sessions = loadSessions().filter(session => session.userId !== interaction.user.id);
      sessions.push({
        messageId: message.id,
        userId: interaction.user.id,
        channelId: interaction.channel.id,
        guildId: interaction.guild?.id ?? null,
        currentQuestion,
        score: 0,
        answers: [],
        startedAt: Date.now()
      });
      saveSessions(sessions);
    }
    catch (error) {
        index.logError(error);
        console.log(`Error executing /iq command: ${error}`);
    }
  }
};
