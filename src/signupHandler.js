const { 
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const { scheduleJob } = require('node-schedule');

/**
 * A global Map storing the original signup message per thread ID
 * so we can later edit it in prio selection.
 */
const ticketMessages = new Map();

/**
 * A global Map storing signups for each thread.
 * signups.get(threadId) => Map<userId, number[]>
 */
const signups = new Map();

/**
 * Dummy function: returns a numeric prio points value for a user.
 * Replace this with your actual logic.
 */
function getPrioPoints(userId) {
  return Math.floor(Math.random() * 200);
}

/**
 * Checks if the user has the scout prio role. Replace with your own role check.
 */
function hasScoutPrioRole(member) {
  // e.g. process.env.SCOUT_PRIO_ROLE_ID is your role ID
  return member.roles?.cache?.has(process.env.SCOUT_PRIO_ROLE_ID) || false;
}

/**
 * Called when the user submits the "signupModal".
 * Creates a public thread with an initial embed (no user signups yet).
 */
async function processSignup(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  // Parse modal fields
  const timerStartStr = interaction.fields.getTextInputValue('timerStart'); // e.g. "14:00"
  const timerEndStr   = interaction.fields.getTextInputValue('timerEnd');   // e.g. "16:00"

  // Convert the times to a Date in UTC for scheduling
  const now = new Date();
  const [startHour, startMinute] = timerStartStr.split(':').map(Number);
  const [endHour, endMinute]     = timerEndStr.split(':').map(Number);
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const timerStart = new Date(todayUTC);
  timerStart.setUTCHours(startHour, startMinute, 0, 0);

  const timerEnd = new Date(todayUTC);
  timerEnd.setUTCHours(endHour, endMinute, 0, 0);

  const dateString = todayUTC.toISOString().split('T')[0];

  // Build the embed's text
  const embedDescription =
`${member.user}'s WB Party ${timerStartStr} - ${timerEndStr} (${dateString} UTC)
Unhallowed Cloister ${dateString}
<@&${process.env.WB_MEMBER_ROLE_ID}>

----
Prio: Scout prio > by points
T9+ DPS
Prio to Why Not members / Why Not Rat attendance

----
1️⃣  Main Tank:
2️⃣  Off Tank:
3️⃣  Main Healer:
4️⃣  Looter GA:
5️⃣  Supp Frost/Shadowcaller:
6️⃣  DPS:
7️⃣  DPS Frost / Blazing:
8️⃣  Leech / DPS:
9️⃣  DPS / LC:
🔟  Lizard:

----
Roaming rats:
🐀 Roaming Rat:
🐀 Roaming Rat:
🐀 Roaming Rat:`;

  const embed = new EmbedBuilder()
    .setTitle(`${member.user.username}'s WB Party`)
    .setDescription(embedDescription)
    .setColor(0x00AAFF);

  // Send the signup embed
  const signupMessage = await interaction.channel.send({ embeds: [embed] });

  // Create a public thread so everyone can sign up by typing e.g. "1/7/2/8"
  const thread = await signupMessage.startThread({
    name: `ticket-${member.user.username}`,
    type: ChannelType.PublicThread,
    reason: 'WB Party Signup'
  });

  // Store the signupMessage in our map so we can edit it on prio selection
  ticketMessages.set(thread.id, signupMessage);

  // Initialize an empty map for signups in this thread
  signups.set(thread.id, new Map());

  // 30 minutes before timerStart, do final prio selection
  const selectionTime = new Date(timerStart.getTime() - 30 * 60 * 1000);
  if (selectionTime > new Date()) {
    scheduleJob(selectionTime, async () => {
      await initPrioSelection(thread);
    });
  }

  // Close the modal
  await interaction.reply({ content: `Signup initiated! Check the thread: ${thread.url}`, ephemeral: true });
}

/**
 * Called whenever a user types something in the thread. If it's a pattern like "1/7/2/8",
 * we parse it as roles and store it in signups.
 */
async function handleThreadMessage(message) {
  const thread = message.channel;
  if (!thread.isThread()) return;
  if (!signups.has(thread.id)) return; // This thread wasn't created by signup?

  // e.g. user typed "1/7/2/8"
  const content = message.content.trim();
  // Check if it matches a pattern like "^\d+(?:/\d+)*$"
  const pattern = /^\d+(?:\/\d+)*$/;
  if (!pattern.test(content)) return; // not a role list

  // Parse into an array of numbers
  const roleNumbers = content.split('/').map(str => parseInt(str, 10)).filter(x => x >= 1 && x <= 10);

  // Store it in signups
  signups.get(thread.id).set(message.author.id, roleNumbers);

  // Optionally confirm
  await message.reply({ content: `Your roles [${roleNumbers.join(', ')}] have been recorded.`, allowedMentions: { repliedUser: false } });
}

/**
 * Called when someone types "--init" in the thread or automatically 30 min before start.
 * Sorts by (ScoutPrio + prio points), then tries to fill the 10 roles based on each user's preference list.
 */
async function initPrioSelection(thread) {
  // get the original signup message
  const parentMessage = ticketMessages.get(thread.id);
  if (!parentMessage) {
    console.error("Parent message not found for thread", thread.id);
    return;
  }

  // get the signup map for this thread
  const threadSignups = signups.get(thread.id);
  if (!threadSignups) return;

  // We need to fetch members so we can check who has the scout prio role
  const membersCollection = await thread.members.fetch();

  // Build an array of { userId, roles: number[], prio: number, isScout: boolean }
  let signupArray = [];
  for (const [userId, roleNumbers] of threadSignups.entries()) {
    const member = membersCollection.get(userId);
    if (!member) continue; // user not in thread or no longer available

    const prioValue = getPrioPoints(userId);
    const scoutPrio = hasScoutPrioRole(member);
    signupArray.push({
      userId,
      roles: roleNumbers, // array of numbers e.g. [1,7,2,8]
      prio: prioValue,
      isScout: scoutPrio
    });
  }

  // Sort: first isScout, then descending prio
  signupArray.sort((a, b) => {
    if (a.isScout && !b.isScout) return -1;
    if (!a.isScout && b.isScout) return 1;
    return b.prio - a.prio;
  });

  // We'll fill the 10 roles from 1..10. We'll store them in an array of strings
  // If a role is not assigned, it's empty. We'll fill it with <@userId> once assigned.
  const finalRoles = new Array(10).fill("");

  // For each user in sorted order, check each of their roles in order. If free, assign.
  for (const signup of signupArray) {
    for (const roleNum of signup.roles) {
      if (!finalRoles[roleNum - 1]) {
        // fill
        finalRoles[roleNum - 1] = `<@${signup.userId}>`;
        break; // assigned one role, move on to next user
      }
    }
  }

  // Build a string representation for the final 10 roles
  // (We keep the same format as the embed)
  const rolesTemplate =
`1️⃣  Main Tank:
2️⃣  Off Tank:
3️⃣  Main Healer:
4️⃣  Looter GA:
5️⃣  Supp Frost/Shadowcaller:
6️⃣  DPS:
7️⃣  DPS Frost / Blazing:
8️⃣  Leech / DPS:
9️⃣  DPS / LC:
🔟  Lizard:`;
  let lines = rolesTemplate.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (finalRoles[i]) {
      lines[i] = lines[i] + ' ' + finalRoles[i];
    }
  }
  const finalRolesString = lines.join('\n');

  // update the embed in the parentMessage
  const oldEmbed = parentMessage.embeds[0];
  if (!oldEmbed) return;
  const updatedDescription = oldEmbed.data.description + `\n\n**Selected Participants:**\n${finalRolesString}`;
  const updatedEmbed = EmbedBuilder.from(oldEmbed).setDescription(updatedDescription);

  await parentMessage.edit({ embeds: [updatedEmbed] });
}

module.exports = {
  processSignup,
  handleThreadMessage,
  initPrioSelection
};
