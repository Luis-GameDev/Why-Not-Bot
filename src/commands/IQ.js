const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const questions = [
  {
    question: "Do you understand that this IQ-Test needs to be taken seriously and completed within 5 minutes?",
    choices: ["Yes", "No"],  
    correct: 0,
  },
  {
    question: "What is the opposite of North-West?",
    choices: ["North-East", "South-East", "South-West"],
    correct: 1,
  },
  {
    question: "What is the capital of France?",
    choices: ["Berlin", "Madrid", "Paris", "Rome"],
    correct: 2,
  },
  {
    question: "Where is the sun rising from on the northern hemisphere?",
    choices: ["East", "West", "North", "South"],
    correct: 0,
  },
  {
    question: "Spell 'cat' backwards.",
    choices: ["act", "tac", "cta", "atc"],
    correct: 1,
  },
  {
    question: "What is the first letter of the English alphabet?",
    choices: ["A", "B", "C", "D"],
    correct: 0,
  },
  {
    question: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops necessarily Lazzies?",
    choices: ["Yes", "No", "Maybe", "I don't know"],
    correct: 0,
  },
  {
    question: "What is the next number in the sequence: 2, 4, 8, 16, ...?",
    choices: ["18", "20", "32", "24"],
    correct: 2,
  },
  {
    question: "Which of the following does not belong: apple, strawberry, carrot, grape?",
    choices: ["apple", "strawberry", "carrot", "grape"],
    correct: 2,
  },
  {
    question: "Which number fits in the gap? [2] [6] [ ] [54] [162]",
    choices: ["9", "18", "4", "28"],
    correct: 1,
  },
  {
    question: "What is 12 divided by 3?",
    choices: ["2", "3", "4", "6"],
    correct: 2,
  },
  {
    question: "Rearrange the letters of 'LISTEN' to form another word.",
    choices: ["SILENT", "ENLIST", "TINSEL", "All of the above"],
    correct: 3,
  },
  {
    question: "If a train travels at 60 miles per hour, how far does it travel in 2 hours?",
    choices: ["60 miles", "120 miles", "180 miles", "240 miles"],
    correct: 1,
  },
];

const dataPath = path.join(__dirname, '../data/iqtest.json');

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iq')
    .setDescription('Take a quick IQ test to assess basic skills.'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    let currentQuestion = 0;
    let score = 0;
    const total = questions.length;
    const userAnswers = [];
    let isProcessing = false;

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
            .setCustomId(`choice_${index}`)
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

    const collector = message.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 300_000
    });

    collector.on('collect', async i => {
      if (isProcessing) return;
      isProcessing = true;

      const selected = parseInt(i.customId.split('_')[1], 10);
      const q = questions[currentQuestion];

      userAnswers.push(selected);
      if (selected === q.correct) score++;

      await i.deferUpdate();
      currentQuestion++;

      if (currentQuestion < total) {
        await interaction.editReply({
          embeds: [createQuestionEmbed()],
          components: [createButtonsRow()],
        });
        isProcessing = false;
      } else {
        collector.stop('completed');
        try {
          await interaction.editReply({ content: '\u200B', embeds: [], components: [] });
        } catch (error) {
          console.error('Error editing reply:', error);
        }

        const resultMessage = await interaction.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('IQ Test Completed')
              .setDescription(`${interaction.user} scored ${score} out of ${total}!`)
              .setColor(0x00ff00)
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('show_results')
                .setLabel('Show Results')
                .setStyle('Secondary')
            )
          ]
        });

        const results = loadResults();
        results.push({
          messageId: resultMessage.id,
          user: interaction.user.id,
          score,
          answers: userAnswers,
          timestamp: Date.now()
        });
        saveResults(results);
      }
    });

        collector.on('end', async (collected, reason) => {
      if (reason !== 'completed') {
        try {
          await interaction.editReply({ content: '\u200B', embeds: [], components: [] });
        } catch (error) {
          console.error('Error editing reply:', error);
        }

        const resultMessage = await interaction.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('IQ Test Ended')
              .setDescription(`Time's up! ${interaction.user} scored ${score} out of ${total}.`)
              .setColor(0xff0000)
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('show_results')
                .setLabel('Show Results')
                .setStyle('Secondary')
            )
          ]
        });

        const results = loadResults();
        results.push({
          messageId: resultMessage.id,
          user: interaction.user.id,
          score,
          answers: userAnswers,
          timestamp: Date.now()
        });
        saveResults(results);
      }
    });
  },
};
