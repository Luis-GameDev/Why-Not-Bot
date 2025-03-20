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


let clientInstance;

function setClient(client) {
    clientInstance = client;
}

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
      active : 1,
      roles: {}
    };

    fs.writeFileSync(worldbossDataFile, JSON.stringify(worldbossData, null, 2));
}

async function assignUserToRoles(messageId, userId, role) {
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
        return;
      }
    }

    worldbossData[messageId].roles[role] = userId;

    //msg = await fetchMessage(process.env.WB_CALL_CHANNEL_ID, messageId)
    //let embedParent = EmbedBuilder.from(msg.embeds[0]);
    //await updateEmbedFromRoles(embedParent, worldbossData[messageId].roles);

    fs.writeFileSync(worldbossDataFile, JSON.stringify(worldbossData, null, 2));
}

async function fetchMessage(channelId, messageId) {
  const channel = await clientInstance.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    return Console.error("Couldnt fetch channel")
  }
  const message = await channel.messages.fetch(messageId);
  return message;
}

async function processSignup(interaction) {
  const friendUserId = interaction.fields.getTextInputValue('friendUser');
    if (friendUserId && !/^\d{17,19}$/.test(friendUserId)) {
      return interaction.reply({
        content: 'Friend-ID must be a valid Discord user ID.',
        ephemeral: true
      });
    }
    const friendUserInput = interaction.fields.getTextInputValue('friendUser');
    if (friendUserInput) { 
      const roleIndex = parseInt(interaction.fields.getTextInputValue('roleIndex'), 10);
      if (isNaN(roleIndex) || roleIndex < 2 || roleIndex > 10) {
      return interaction.reply({
        content: 'Role-Index must be a number between 2 and 10.',
        ephemeral: true
      });
      }
    }

  member = interaction.member;

  timerStartStr = interaction.fields.getTextInputValue('timerStart'); 
  timerEndStr = interaction.fields.getTextInputValue('timerEnd');   
  friendID = interaction.fields.getTextInputValue('friendUser');
  friendRole = interaction.fields.getTextInputValue('roleIndex');

  if (!/^\d{2}:\d{2}$/.test(timerStartStr) || !/^\d{2}:\d{2}$/.test(timerEndStr)) {
    return interaction.reply({
      content: 'Timer start and end must be in the format HH:MM (e.g., 16:00).',
      ephemeral: true
    });
  }

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
`;

  const embed = new EmbedBuilder()
    .setTitle(`Worldboss Famefarm`)
    .setDescription(embedDescription)
    .setColor(0x00AAFF);

  const signupMessage = await interaction.channel.send({ embeds: [embed] });

  await ensureDataStructure(signupMessage.id);
  let callerRole = "1"
  await assignUserToRoles(signupMessage.id, member.id, callerRole);

  if(friendID && friendRole && friendRole > 1 && friendRole < 11) {
    assignUserToRoles(signupMessage.id, friendID, friendRole);
  }

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

  // get roles
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

  updateEmbedFromRoles(EmbedBuilder.from(signupMessage.embeds[0]), worldbossData[signupMessage.id].roles, signupMessage)

  await interaction.reply({ content: `Signup initiated! Check the thread: ${thread.url}`, ephemeral: true });
}

function hasScoutPrioRole(member) {
  return member.roles?.cache?.has(process.env.SCOUT_PRIO_ROLE_ID) || false;
}

function updateEmbedFromRoles(parentEmbed, roles, parentMessage) {
  for (const [roleIndex, userId] of Object.entries(roles)) {
    updateParentEmbedWithRole(parentEmbed, parseInt(roleIndex, 10), userId, parentMessage);
  }
}


async function updateParentEmbedWithRole(parentEmbed, roleNr, userId, parentMessage) {
  const roleEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  const targetEmoji = roleEmojis[roleNr - 1];
  console.log("Altering parent embed")

  let description = parentEmbed.data.description || "";
  let lines = description.split("\n");
  let updated = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(targetEmoji)) {
      const colonIndex = lines[i].indexOf(":");
      if (colonIndex !== -1) {
        console.log("Added "+userId)
        lines[i] = lines[i].substring(0, colonIndex + 1) + ` <@${userId}>`;
      } else {
        lines[i] = lines[i] + `: <@${userId}>`;
      }
      updated = true;
      break;
    }
  }

  if (updated) {
    let newDescription = lines.join("\n");
    await parentEmbed.setDescription(newDescription);
    parentMessage.edit({ embeds: [parentEmbed] })
  }
  return parentEmbed;
}


async function initPrioSelection(thread) {
  const parentMessage = await thread.fetchStarterMessage();
  if (!parentMessage) {
    console.error("Parent message not found for thread", thread.id);
    return;
  }

  // Fetch up to 100 messages in the thread (which contain the signup entries)
  await thread.messages.fetch({ limit: 100 });
  const threadSignups = thread.messages.cache.filter(m =>
    !m.author.bot && /^\d+(?:\/\d+)*$/.test(m.content.trim())
  );
  
  let signupArray = [];
  // Iterate over the signup messages correctly
  for (const [userId, msg] of threadSignups.entries()) {
    console.log(msg.content);
    const prioValue = Plusones.getUserPrio(msg.author.id);
    const scoutPrio = hasScoutPrioRole(msg.author);
    const roleNumbers = msg.content.trim().split('/').map(Number).filter(x => x >= 1 && x <= 10);
    signupArray.push({
      userId: msg.author.id,
      roles: roleNumbers,
      prio: prioValue,
      isScout: scoutPrio
    });
  }

  // Sort signups: scouts first, then by descending prio
  signupArray.sort((a, b) => {
    if (a.isScout && !b.isScout) return -1;
    if (!a.isScout && b.isScout) return 1;
    return b.prio - a.prio;
  });

  // Load the existing worldbossData for the parent message.
  let worldbossData = {};
  if (fs.existsSync(worldbossDataFile)) {
    try {
      const data = fs.readFileSync(worldbossDataFile, 'utf8');
      worldbossData = data.length ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error parsing worldboss data:', error);
      worldbossData = {};
    }
  }
  if (!worldbossData[parentMessage.id]) {
    worldbossData[parentMessage.id] = { roles: {} };
  }
  const jsonRoles = worldbossData[parentMessage.id].roles;

  for (const signup of signupArray) {
    if (Object.values(jsonRoles).includes(signup.userId)) {
      continue;
    }

    for (const roleNum of signup.roles) {
      if (jsonRoles.hasOwnProperty(roleNum.toString())) {
        continue;
      } else {
        await assignUserToRoles(parentMessage.id, signup.userId, roleNum);
        let parentEmbed = EmbedBuilder.from(parentMessage.embeds[0]);
        await updateParentEmbedWithRole(parentEmbed, roleNum, signup.userId, parentMessage);
        await parentMessage.edit({ embeds: [parentEmbed] });
        break;
      }
    }
  }
}


module.exports = {
  processSignup,
  initPrioSelection,
  setClient
};
