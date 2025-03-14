const { 
    ChannelType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    EmbedBuilder 
  } = require('discord.js');
  const { scheduleJob } = require('node-schedule');
  
  async function processSignup(interaction) {
    // Parse modal inputs:
    const timerStartStr = interaction.fields.getTextInputValue('timerStart'); // z.B. "14:00" (UTC)
    const timerEndStr = interaction.fields.getTextInputValue('timerEnd');     // z.B. "16:00" (UTC)
    const friendUserInput = interaction.fields.getTextInputValue('friendUser'); // erwartet z. B. eine ID oder Mention
    const roleIndexStr = interaction.fields.getTextInputValue('roleIndex');   // Zahl zwischen 1 und 10
  
    // Validate role index:
    const roleIndex = parseInt(roleIndexStr, 10);
    if (isNaN(roleIndex) || roleIndex < 1 || roleIndex > 10) {
      return interaction.reply({ content: 'Ungültiger Rollenindex. Bitte gebe eine Zahl zwischen 1 und 10 ein.', ephemeral: true });
    }
  
    // Parse timer times (angenommen im Format "HH:mm", UTC)
    const now = new Date();
    const [startHour, startMinute] = timerStartStr.split(':').map(Number);
    const [endHour, endMinute] = timerEndStr.split(':').map(Number);
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const timerStart = new Date(todayUTC);
    timerStart.setUTCHours(startHour, startMinute, 0, 0);
    const timerEnd = new Date(todayUTC);
    timerEnd.setUTCHours(endHour, endMinute, 0, 0);
  
    // Build the header line using today’s date
    const dateString = todayUTC.toISOString().split('T')[0]; // "YYYY-MM-DD"
  
    // Static template for roles list (always the same)
const rolesListTemplate = 
`1️⃣  Main Tank: 
2️⃣  Off Tank: 
3️⃣  Main Healer: 
4️⃣  Looter GA: 
5️⃣  Supp Frost/Shadowcaller: 
6️⃣  DPS: 
7️⃣  DPS Frost / Blazing: 
8️⃣  Leech / DPS: 
9️⃣  DPS / LC: 
🔟  Lizard: `;

// Split the template into lines (an array of 10 strings)
let rolesListLines = rolesListTemplate.split('\n');

// If a friend is provided, update the selected role line
if (friendUserInput) {
  let friendMention = friendUserInput.trim();
  if (!friendMention.startsWith('<@')) {
    friendMention = `<@${friendMention}>`;
  }
  // Replace the corresponding line with the friend mention appended
  rolesListLines[roleIndex - 1] = rolesListLines[roleIndex - 1] + friendMention;
}

// Join the lines back to form the final roles list string
const roleList = rolesListLines.join('\n');

// Then build your embed description using the static role list:
const embedDescription =
  `${interaction.user}'s WB Party ${timerStartStr} - ${timerEndStr} (${dateString} UTC)\n` +
  `Unhallowed Cloister ${dateString}\n` +
  `<@&${process.env.WB_MEMBER_ROLE_ID}>\n\n` +
  "----\n\n" +
  "Prio: Scout prio > by points\n" +
  "T9+ DPS\n" +
  "Prio to Why Not members / Why Not Rat attendance\n\n" +
  roleList + "\n\n" +
  "----\n\n" +
  "Roaming rats:\n" +
  "🐀 Roaming Rat:\n" +
  "🐀 Roaming Rat:\n" +
  "🐀 Roaming Rat:";

const embed = new EmbedBuilder()
  .setTitle(`${interaction.user.username}'s WB Party`)
  .setDescription(embedDescription)
  .setColor(0x00AAFF);

  
    // Send the embed in the same channel as the modal was submitted
    const signupMessage = await interaction.channel.send({ embeds: [embed] });
  
    // Create a private thread on that message (the ticket)
    const thread = await signupMessage.startThread({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.PrivateThread,
      reason: 'WB Party Signup'
    });
  
    // Grant the ticket creator access silently.
    await thread.permissionOverwrites.edit(interaction.user.id, {
      ViewChannel: true,
      SendMessages: true
    });
  
    // Also add the friend user, if provided.
    if (friendUserInput) {
      let friendId = friendUserInput.trim();
      if (friendId.startsWith('<@') && friendId.endsWith('>')) {
        friendId = friendId.replace(/<@!?/, '').replace('>', '');
      }
      await thread.permissionOverwrites.edit(friendId, {
        ViewChannel: true,
        SendMessages: true
      });
    }
  
    // Schedule the priority selection 30 minutes before timerStart
    const selectionTime = new Date(timerStart.getTime() - 30 * 60 * 1000);
    if (selectionTime > new Date()) {
      scheduleJob(selectionTime, async () => {
        // TODO: Implement your selection logic based on prio points and scout prio role.
        // For now, append a placeholder line.
        const updatedDescription = embed.data.description + "\n\nSelected: @User1, @User2";
        const updatedEmbed = EmbedBuilder.from(embed).setDescription(updatedDescription);
        await signupMessage.edit({ embeds: [updatedEmbed] });
      });
    }
  
    // Finally, reply to the modal submission so that the modal closes.
    await interaction.reply({ content: `Signup initiated! Check the thread: ${thread.url}`, ephemeral: true });
  }
  
  module.exports = { processSignup };
  