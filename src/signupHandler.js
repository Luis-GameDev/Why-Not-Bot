const { 
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const { scheduleJob } = require('node-schedule');
const Plusones = require("./plusones.js");

const ticketMessages = new Map();

const signups = new Map();

function hasScoutPrioRole(member) {
  return member.roles?.cache?.has(process.env.SCOUT_PRIO_ROLE_ID) || false;
}

async function processSignup(interaction) {
  const member = interaction.member;

  const timerStartStr = interaction.fields.getTextInputValue('timerStart'); 
  const timerEndStr   = interaction.fields.getTextInputValue('timerEnd');   

  const now = new Date();
  const [startHour, startMinute] = timerStartStr.split(':').map(Number);
  const [endHour, endMinute]     = timerEndStr.split(':').map(Number);
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let timerStart = new Date(todayUTC);
  timerStart.setUTCHours(startHour, startMinute, 0, 0);

  let timerEnd = new Date(todayUTC);
  timerEnd.setUTCHours(endHour, endMinute, 0, 0);

  if (timerStart < now) {
    timerStart.setUTCDate(timerStart.getUTCDate() + 1);
    timerEnd.setUTCDate(timerEnd.getUTCDate() + 1);
  }

  const embedDescription =
`${member.user}'s WB Party 
**${timerStartStr} - ${timerEndStr} UTC** 

<t:${Math.floor(timerStart.getTime() / 1000)}:F>
<t:${Math.floor(timerStart.getTime() / 1000)}:R>

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

  const signupMessage = await interaction.channel.send({ embeds: [embed] });

  const thread = await signupMessage.startThread({
    name: `WB-${startHour}-${member.user.username}`,
    type: ChannelType.PublicThread,
    reason: 'WB Party Signup'
  });

  ticketMessages.set(thread.id, signupMessage);

  signups.set(thread.id, new Map());

  const selectionTime = new Date(timerStart.getTime() - 30 * 60 * 1000);
  if (selectionTime > new Date()) {
    scheduleJob(selectionTime, async () => {
      await initPrioSelection(thread);
    });
  }

  await interaction.reply({ content: `Signup initiated! Check the thread: ${thread.url}`, ephemeral: true });
}

async function handleThreadMessage(message) {
  const thread = message.channel;
  if (!thread.isThread()) return;
  if (!signups.has(thread.id)) return;

  const content = message.content.trim();
  const pattern = /^\d+(?:\/\d+)*$/;
  if (!pattern.test(content)) return; 

  const roleNumbers = content.split('/').map(str => parseInt(str, 10)).filter(x => x >= 1 && x <= 10);

  signups.get(thread.id).set(message.author.id, roleNumbers);

  await message.reply({ content: `Your roles [${roleNumbers.join(', ')}] have been recorded.`, allowedMentions: { repliedUser: false } });
}

function hasScoutPrioRole(member) {
  return member.roles?.cache?.has(process.env.SCOUT_PRIO_ROLE_ID) || false;
}

async function initPrioSelection(thread) {
  const parentMessage = ticketMessages.get(thread.id);
  if (!parentMessage) {
    console.error("Parent message not found for thread", thread.id);
    return;
  }

  const threadSignups = signups.get(thread.id);
  if (!threadSignups) return;

  const membersCollection = await thread.members.fetch();

  let signupArray = [];
  for (const [userId, roleNumbers] of threadSignups.entries()) {
    const member = membersCollection.get(userId);
    if (!member) continue; 

    const prioValue = Plusones.getUserPrio(userId);
    const scoutPrio = hasScoutPrioRole(member);
    signupArray.push({
      userId,
      roles: roleNumbers, 
      prio: prioValue,
      isScout: scoutPrio
    });
  }

  signupArray.sort((a, b) => {
    if (a.isScout && !b.isScout) return -1;
    if (!a.isScout && b.isScout) return 1;
    return b.prio - a.prio;
  });

  const finalRoles = new Array(10).fill("");

  for (const signup of signupArray) {
    for (const roleNum of signup.roles) {
      if (!finalRoles[roleNum - 1]) {
        finalRoles[roleNum - 1] = `<@${signup.userId}>`;
        break; 
      }
    }
  }

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
