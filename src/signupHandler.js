const { 
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const { scheduleJob } = require('node-schedule');
const Plusones = require("./plusones.js");
const path = require('path');
const worldbossDataFile = path.join(__dirname, './data/worldbossData.json');
const fs = require('fs');

let member;
let timerStartStr;
let timerEndStr;
let timerStart;
let timerEnd;

function hasScoutPrioRole(member) {
  return member.roles?.cache?.has(process.env.SCOUT_PRIO_ROLE_ID) || false;
}

function ensureDataStructure(messageId) {
    let worldbossData = {};

    if (fs.existsSync(worldbossDataFile)) {
        try {
            const data = fs.readFileSync(worldbossDataFile);
            worldbossData = data.length ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error parsing worldboss data:', error);
            worldbossData = {};
        }
    }

    worldbossData[messageId] = {
      hostUID: member.id,
      startUTC: timerStartStr,
      endUTC: timerEndStr,
      startTime: Math.floor(timerStart.getTime() / 1000),
      endTime: Math.floor(timerEnd.getTime() / 1000),
      roles: {}
    };

    fs.writeFileSync(worldbossDataFile, JSON.stringify(worldbossData, null, 2));
}

function assignUserToRoles(messageId, userId, role) {
    Console.Log("Trying to assign user to role")
    if (role < 1 || role > 10) return;

    let worldbossData = {};

    if (fs.existsSync(worldbossDataFile)) {
        try {
          const data = fs.readFileSync(worldbossDataFile);
          worldbossData = data.length ? JSON.parse(data) : {};
        } catch (error) {
          console.error('Error parsing worldboss data:', error);
          worldbossData = {};
        }
    }
    for (const key in worldbossData[messageId].roles) {
      if (worldbossData[messageId].roles[key] == userId) {
        Console.Log("User already assigned")
        return;
      }
    }

    Console.Log("Successfully assigned user to role")
    worldbossData[messageId].roles[role] = userId;
    fs.writeFileSync(worldbossDataFile, JSON.stringify(worldbossData, null, 2));
}

async function processSignup(interaction) {
  member = interaction.member;

  timerStartStr = interaction.fields.getTextInputValue('timerStart'); 
  timerEndStr   = interaction.fields.getTextInputValue('timerEnd');   

  const now = new Date();
  const [startHour, startMinute] = timerStartStr.split(':').map(Number);
  const [endHour, endMinute]     = timerEndStr.split(':').map(Number);
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  timerStart = new Date(todayUTC);
  timerStart.setUTCHours(startHour, startMinute, 0, 0);

  timerEnd = new Date(todayUTC);
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
How to signup:
- Type your roles into the thread in the following format: \`1/7/3/10\`
- Type your roles in order of preference, separated by slashes
----
Prio: Scout prio > by points
T9+ DPS
Prio to Why Not members / Why Not Rat attendance

1️⃣  Main Tank: <@${interaction.member.id}>
2️⃣  Off Tank:
3️⃣  Main Healer:
4️⃣  Looter GA:
5️⃣  Supp Frost/Shadowcaller:
6️⃣  DPS:
7️⃣  DPS Frost / Blazing:
8️⃣  Leech / DPS:
9️⃣  DPS / LC:
🔟  Lizard:

Roaming rats:
🐀 Roaming Rat:
🐀 Roaming Rat:
🐀 Roaming Rat:`;

  const embed = new EmbedBuilder()
    .setTitle(`Worldboss Famefarm`)
    .setDescription(embedDescription)
    .setColor(0x00AAFF);

  const signupMessage = await interaction.channel.send({ embeds: [embed] });

  await ensureDataStructure(signupMessage.id);
  assignUserToRoles(signupMessage.id, member.id, 1);

  const thread = await signupMessage.startThread({
    name: `WB-${startHour}UTC-${member.user.username}`,
    type: ChannelType.PublicThread,
    reason: 'WB Party Signup'
  });

  const selectionTime = new Date(timerStart.getTime() - 30 * 60 * 1000);
  if (selectionTime > new Date()) {
    scheduleJob(selectionTime, async () => {
      await initPrioSelection(thread);
    });
  }

  await interaction.reply({ content: `Signup initiated! Check the thread: ${thread.url}`, ephemeral: true });
}

function hasScoutPrioRole(member) {
  return member.roles?.cache?.has(process.env.SCOUT_PRIO_ROLE_ID) || false;
}

async function initPrioSelection(thread) {
  const parentMessage = await thread.fetchStarterMessage();
  if (!parentMessage) {
    console.error("Parent message not found for thread", thread.id);
    return;
  }

  let threadSignups = thread.messages.cache.filter(m => !m.author.bot && /^\d+(?:\/\d+)*$/.test(m.content.trim()));
  let signupArray = [];

  for (const m of threadSignups.entries()) {

    const prioValue = Plusones.getUserPrio(m.author.id);
    const scoutPrio = hasScoutPrioRole(m.author.id);
    const roleNumbers = m.content.trim().split('/').filter(x => x >= 1 && x <= 10);

    signupArray.push({
      userId: m.author.id,
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
        assignUserToRoles(parentMessage.id, signup.userId, parseFloat(roleNum));
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

  if (!parentMessage.embeds || parentMessage.embeds.length === 0) {
    console.error("No embeds found in parent message", parentMessage.id);
    return;
  }
  const oldEmbed = parentMessage.embeds[0];
  const updatedDescription = oldEmbed.data.description.replace(/1️⃣.*Lizard:/s, finalRolesString);
  const updatedEmbed = EmbedBuilder.from(oldEmbed).setDescription(updatedDescription);

  await parentMessage.edit({ embeds: [updatedEmbed] });
}

module.exports = {
  processSignup,
  initPrioSelection
};
