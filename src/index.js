require("dotenv").config();
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ChannelType } = require('discord.js');
const calcStats = require("./weeklyStatsTrack.js");
const Plusones = require("./plusones.js");
const signupHandler = require("./signupHandler.js");
const Ticketsystem = require("./ticketsystem.js");
const axios = require('axios');
const { Client: UnbClient } = require('unb-api');
const balanceBotAPI = new UnbClient(process.env.BALANCE_BOT_API_KEY);
const { processSignup, handleThreadMessage, initPrioSelection } = require('./signupHandler.js');
const GLOBALS = require("./globals.js");

console.log("Starting bot...");

const {
    Client,
    Collection, 
    Partials,
    GatewayIntentBits
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Message, 
        Partials.Channel, 
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User, 
        Partials.GuildMember
    ]
});
client.commands = new Collection();

const commandFiles = fs
    .readdirSync("./src/commands")
    .filter((file) => file.endsWith(".js"));
const eventFiles = fs
    .readdirSync("./src/events")
    .filter((file) => file.endsWith(".js"));

commandFiles.forEach((commandFile) => {
    const command = require(`./commands/${commandFile}`);
    client.commands.set(command.data.name, command);
});

const botChannelId = process.env.BOT_CHANNEL; 
const scoutChannelId = process.env.SCOUT_CHANNEL_ID;
const ctacheckChannelId = process.env.CTA_CHECK_CHANNEL_ID;
  
async function payMember(userId, amount) {
    const logChannel = await client.channels.fetch(process.env.LOGS_CHANNEL_ID);
    const guild = process.env.DISCORD_GUILD_ID;
    balanceBotAPI.editUserBalance(guild, userId, { cash: amount }, "Why Bot Reward-Payment").then(response => {
        const embed = new MessageEmbed()
            .setTitle('Payment')
            .setDescription(`Added ${amount} to <@${userId}> balance.`)
            .setColor(0x00FF00);
        logChannel.send({ embeds: [embed] });
    }).catch(error => {
        const embed = new MessageEmbed()
            .setTitle('Payment Error')
            .setDescription(`Error making payment of ${amount} to <@${userId}>, please pay him manually.`)
            .addField('Error', error.message)
            .setColor(0xFF0000);
        logChannel.send({ embeds: [embed] });
    })
}

async function checkForGuildmembers() {
  const usersPath = path.join(__dirname, './data/users');
  const files = fs.readdirSync(usersPath).filter(file => file.endsWith('.json'));

  const res = await axios.get(`https://gameinfo-ams.albiononline.com/api/gameinfo/guilds/${process.env.ALBION_GUILD_ID}/members`);
  const guildData = res.data;
  const guildMemberIds = guildData.map(member => member.Id);

  for (const file of files) {
    const filePath = path.join(usersPath, file);
    const userData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (userData.ignoreCheck) continue;

    const isInGuild = guildMemberIds.includes(userData.playerId);
    if (!isInGuild) {

      if (userData.linkTime && Date.now() - userData.linkTime < 24 * 60 * 60 * 1000) {
        continue;
      }

      const logChannel = await client.channels.fetch(process.env.LOGS_CHANNEL_ID);
      if (!logChannel) continue;

      const embed = new MessageEmbed()
        .setTitle('Guild Check: Member Left')
        .setDescription(`Player **${userData.ign}** (<@${userData.discordId}>) is no longer in the guild.`)
        .setColor(0xff0000)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`purge_${userData.discordId}`)
          .setLabel('Friend')
          .setStyle("Primary"),
        new ButtonBuilder()
          .setCustomId(`ignore_${userData.discordId}`)
          .setLabel('Ignore')
          .setStyle("Secondary"),
        new ButtonBuilder()
          .setCustomId(`kick_${userData.discordId}`)
          .setLabel('Kick')
          .setStyle("Danger")
      );

      await logChannel.send({
        embeds: [embed],
        components: [row]
      });
    }
  }
}

client.on("guildMemberAdd", async (member) => {
    if (member.guild.id !== process.env.DISCORD_GUILD_ID) return;
    
    const publicChannel = await client.channels.fetch(process.env.PUBLIC_CHANNEL_ID);
    await member.roles.add(process.env.NOTLINKED_ROLE_ID).catch(console.error);
    publicChannel.send(`Welcome ${member}!` + GLOBALS.WelcomeMessage);
});

client.on("messageReactionAdd", async (reaction, user) => {

    originalMessage = reaction.message;

    if (reaction.emoji.name === "❌" && reaction.message.channel.id === process.env.STANDING_CHECK_CHANNEL_ID) {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (!member.roles.cache.has(process.env.WB_CALLER_ROLE_ID)) {
            return;
        }
    
        const mentionedUsers = reaction.message.mentions.users;
        const scoutPrioRole = reaction.message.guild.roles.cache.get(process.env.SCOUT_PRIO_ROLE_ID);
    
        if (!scoutPrioRole) {
            return reaction.message.reply("Scout prio role not found.");
        }
    
        for (const [userId] of mentionedUsers) {
            const mentionedMember = await reaction.message.guild.members.fetch(userId).catch(() => null);
            if (mentionedMember && mentionedMember.roles.cache.has(scoutPrioRole.id)) {
                await mentionedMember.roles.remove(scoutPrioRole);
            }
        }
    
        await reaction.message.reply("Scout prio role has been removed from mentioned users.");
        return;
    }
    
    if (reaction.emoji.name === "✅" && reaction.message.channel.id === process.env.STANDING_CHECK_CHANNEL_ID) {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (!member.roles.cache.has(process.env.WB_CALLER_ROLE_ID)) {
            return;
        }
    
        const mentionedUsers = reaction.message.mentions.users;
        const scoutPrioRole = reaction.message.guild.roles.cache.get(process.env.SCOUT_PRIO_ROLE_ID);
    
        if (!scoutPrioRole) {
            return reaction.message.reply("Scout prio role not found.");
        }
    
        for (const [userId] of mentionedUsers) {
            const mentionedMember = await reaction.message.guild.members.fetch(userId).catch(() => null);
            if (mentionedMember && !mentionedMember.roles.cache.has(scoutPrioRole.id)) {
                await mentionedMember.roles.add(scoutPrioRole);
            }
        }
    
        await reaction.message.reply("Scout prio role has been added to mentioned users.");
        return;
    }
    
    if (reaction.message.channel.id === process.env.REWARD_CHANNEL && !user.bot) {

        const member = await reaction.message.guild.members.fetch(user.id);

        const checkmarkReaction = reaction.message.reactions.cache.find(r => r.emoji.name === "✅");
        if (checkmarkReaction) return;

        switch (reaction.emoji.name) {
            case GLOBALS.random.reaction:
                if (member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {

                    for (let i = 0; i < GLOBALS.random.amount; i++) {
                        Plusones.addRandomPlus(reaction.message.author.id, GLOBALS.random.reason);
                    }

                    reaction.message.reply(`You have received ${GLOBALS.random.amount}x points <@${reaction.message.author.id}>.`);
                    reaction.message.react("✅");
                }
            break;

            case GLOBALS.greenCore.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    if (member.id === "342001696651739136") {
                        reaction.message.channel.send(`Please stfu <@${user.id}> <3`)
                        return;
                    }
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.greenCore.payment}** for securing the ${GLOBALS.greenCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.greenCore.payment);
            break;

            case GLOBALS.blueCore.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.blueCore.payment}** for securing the ${GLOBALS.blueCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.blueCore.payment);
            break;

            case GLOBALS.purpleCore.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.purpleCore.payment}** for securing the ${GLOBALS.purpleCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.purpleCore.payment);
            break;

            case GLOBALS.goldCore.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.goldCore.payment}** for securing the ${GLOBALS.goldCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.goldCore.payment);
            break;

            case GLOBALS.greenVortex.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.greenVortex.payment}** for securing the ${GLOBALS.greenVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.greenVortex.payment);
            break;

            case GLOBALS.blueVortex.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.blueVortex.payment}** for securing the ${GLOBALS.blueVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.blueVortex.payment);
            break;

            case GLOBALS.purpleVortex.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.purpleVortex.payment}** for securing the ${GLOBALS.purpleVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.purpleVortex.payment);
            break;

            case GLOBALS.goldVortex.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.goldVortex.payment}** for securing the ${GLOBALS.goldVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.goldVortex.payment);
            break;

            case GLOBALS.greenCoreRavine.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.greenCoreRavine.payment}** for securing the ${GLOBALS.greenCoreRavine.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.greenCoreRavine.payment);
            break;

            case GLOBALS.blueCoreRavine.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.blueCoreRavine.payment}** for securing the ${GLOBALS.blueCoreRavine.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.blueCoreRavine.payment);
            break;

            case GLOBALS.purpleCoreRavine.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.purpleCoreRavine.payment}** for securing the ${GLOBALS.purpleCoreRavine.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.purpleCoreRavine.payment);
            break;

            case GLOBALS.goldCoreRavine.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${GLOBALS.goldCoreRavine.payment}** for securing the ${GLOBALS.goldCoreRavine.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, GLOBALS.goldCoreRavine.payment);
            break;

            default:
            break;
        }
    }
});

client.on("messageCreate", async (message) => {
    if (message.content.startsWith("!abc") && !message.author.bot) {
        checkForGuildmembers();
    }
    if (message.channel.isThread() && message.content.startsWith("--init")) {
        //await handleThreadMessage(message);
    
        await initPrioSelection(message.channel);
        message.reply("Prio selection has been executed.");
    }

    if (message.content.startsWith("!acceptvod")) {
        const channel = message.channel.parent.id;

        if (channel !== process.env.VOD_CHANNEL_ID) return;
        const member = await message.guild.members.fetch(message.author.id);
        
        if (!member.roles.cache.has(process.env.VODREVIEWER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }
        
        const vodAuthorMessage = await message.channel.fetchStarterMessage();
        const vodAuthor = vodAuthorMessage.author.id;

        Plusones.addVodPlus(vodAuthor, message.author.id);
        Plusones.addRandomPlus(message.author.id, `VOD Review for ${vodAuthor}`);
        Plusones.addRandomPlus(message.author.id, `VOD Review for ${vodAuthor}`);

        const logChannel = await client.channels.fetch(process.env.LOGS_CHANNEL_ID);
        const guild = process.env.DISCORD_GUILD_ID;
        const embed = new MessageEmbed()
            .setTitle('VOD Accepted')
            .setDescription(`<@${message.author.id}> reviewed <@${vodAuthor}>'s VOD.`)
            .setColor(0x00FF00);
        logChannel.send({ embeds: [embed] });
    
        return message.reply(`You have successfully accepted the VOD of <@${vodAuthor}>. Both of you have received points.`);
    }

    if (message.content === "--stats" && message.author.id === process.env.OWNER_USER_ID) {
        operateWeeklyStatsTrack()
    }

    if (message.channel.id === ctacheckChannelId && message.content.startsWith("+1") && !message.author.bot) {
        const userId = message.author.id;
        const parts = message.content.split(" ");
        let caller = parts[1];
        const link = parts[2];

        if (!caller || !link || !link.startsWith("https://discord.com/channels/")) {
            return message.reply("Please provide a caller and a valid link.");
        }

        if (caller.startsWith('<@') && caller.endsWith('>')) {
            caller = caller.slice(2, -1);
            if (caller.startsWith('!')) {
                caller = caller.slice(1);
            }
        }

        const plusamount = Plusones.addCtaManuallyPlus(userId, caller, link);
        message.reply(`<@${userId}>, you now have **${plusamount}** CTA +1s.`);
    }

    if (message.channel.id === scoutChannelId && message.content.startsWith("+1") && !message.author.bot) {
        const userId = message.author.id;
        const parts = message.content.split(" ").slice(1);
        const inputDate = parts.join(" ").trim();

        const plusamount = Plusones.addScoutPlus(userId, inputDate)
        
        message.reply(`<@${userId}>, you now have **${plusamount}** Scout +1s.`);
    }

    if (message.channel.id === botChannelId && message.content.startsWith("+1") && !message.author.bot) {
        const userId = message.author.id;
        const parts = message.content.split(" ").slice(1);
        const inputDate = parts.join(" ").trim();

        const plusamount = Plusones.addRatPlus(userId, inputDate)

        if(plusamount >= 15) {
           
            const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
            const member = guild.members.cache.get(userId);
            const role = guild.roles.cache.get(process.env.RAT_ROLE_ID);
            
            if (member && role && !member.roles.cache.has(role.id)) {
                member.roles.add(role).catch(console.error);
                message.reply("You now have the Rat role!");
            }
        }
        
        message.reply(`<@${userId}>, you now have **${plusamount}** Rat +1s.`);
    }

    if (message.content.startsWith("!wb")) {
        message.reply(`if you're interested in joining World Boss fame farm activities, you shall open a ticket in https://discord.com/channels/1248205717379354664/1274422719168909323. Requirements are the following: Ability to use a scout while fame farming. 100 spec on weapon / offhand from https://discord.com/channels/1248205717379354664/1248254004962525255 If playing DPS, higher spec might be required Vouch of WB members (not mandatory but appreciated) Willingness to rat (!rat for more info).`);
    }

    if (message.content.startsWith("!rewards")) {
        message.reply(`Guild rewards a various set of activities, like delivering Power Cores to hideout or killing enemies in Unhallowed Cloister. To check what we redeem, https://discord.com/channels/1248205717379354664/1300766799209431101. \nTo redeem rewards, you can ask any Officer.`);
    }

    if(message.content.startsWith("!macro")) {
        message.reply(`https://discord.com/channels/1248205717379354664/1284834513280831540/1311125721128767488`);
    }

    if (message.content.startsWith("!info")) {
        message.reply(`https://discord.com/channels/1248205717379354664/1274422719168909323 = Apply for Worldboss member role / issue WB releted complains. \nhttps://discord.com/channels/1248205717379354664/1248254004962525255 = Why not builds for WB \nhttps://discord.com/channels/1248205717379354664/1319310140222079006 = DPS and other tutorials made by our members. Follow these to get GOOD at your weapon and learn your rotations for WB. \nhttps://discord.com/channels/1248205717379354664/1267166145618640957 = NAPs \n"How to redeem balance? 💸 " - Contact any officer that is online and request your Discord Balance.`);
    }

    if (message.content.startsWith("!complain")) {
        message.reply(`If you have something to say or to complain about, you can open a ticket here https://discord.com/channels/1248205717379354664/1281971928231444490 \nOnly Overseers will be able to read it, so don't worry if you have an issue with an officer or caller.`);
    }

    if (message.content.startsWith("!rat")) {
        message.reply(`Ratting in WB means coming with an approved #"Guccirats" set or a T4 Rat set from Rat Gear tab in hideout bank and defend the worldboss from enemies trying to kill our pve party by knocking them into mobs / invis bombing / diving with SS gear. Usually once enemies are spotted, someone pings in https://discord.com/channels/1248205717379354664/1270502535702118400 or https://discord.com/channels/1229028530990350366/1229028531019841615 \n Once you came to defend the party, you can type \"+1 [Link of the call message]\" here: https://discord.com/channels/1248205717379354664/1316458591699341344 to have your participation counted by the bot.`);
    }

    if (message.content.startsWith("!regears")) {
        message.reply(`PVP Activity regear: T7 gear T8 Weapon. OC break included. Consumables / mounts not included. Ask caller to be sure. WB Regears: https://discord.com/channels/1248205717379354664/1250066776335843389`);
    }

    if (message.content.startsWith("!list")) {
        message.reply(`# !commands Explained: #\n\n
**!wb** - Provides information about joining World Boss fame farm activities, including requirements and a link to open a ticket.\n
**!rewards** - Details the guild rewards for various activities and provides a link to check what can be redeemed.\n
**!info** - Shares multiple links for different purposes such as applying for the Worldboss member role, builds for WB, tutorials, and how to redeem balance.\n
**!complain** - Informs users on how to open a ticket for complaints, ensuring that only Overseers will read the complaints.\n
**!rat** - Explains what ratting in WB means, the gear required, and how to defend the worldboss from enemies. It also provides links for reporting enemy sightings and counting participation.\n
**!regears** - Provides information about PVP Activity regear requirements and a link for WB Regears.`);
    }

    if (message.content.startsWith("!acceptapply")) {
        const channel = message.channel;
        const member = await message.guild.members.fetch(message.author.id);
    
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }
    
        if (channel.name.includes("ticket")) {
            const newChannelName = channel.name.replace("ticket", "accepted-ticket");
            const link = message.content.split(" ")[1];
    
            if (link) {
                const ticketLink = link;
                await message.reply(`Your Wb application has been accepted. Please follow the following steps:\n- Join the discord linked\n- Bind your murder-ledger\n- Open a ticket and fill the ticket\n- Tag Mendo as vouch. \n ${ticketLink}`);
            } else {
                await message.reply("No link provided.");
            }
    
            try {
                console.log(`Old channel name: ${channel.name}, New channel name: ${newChannelName}`);
                await channel.setName(newChannelName);
            } catch (error) {
                console.error("Error setting the channel name:", error);
            }
        }
    }

    if(message.content.startsWith("!purge")) {
        const mentionedUsers = message.mentions.users;
        const member = await message.guild.members.fetch(message.author.id);
    
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }

        if (mentionedUsers.size === 0) {
            return message.reply("No users mentioned.");
        }

        const botMember = await message.guild.members.fetch(client.user.id);
        const botHasPermission = botMember.permissions.has("MANAGE_ROLES");

        if (!botHasPermission) {
            return message.reply("I do not have permission to manage roles.");
        }

        const failedRolesMap = new Map();

        for (const user of mentionedUsers.values()) {
            const member = await message.guild.members.fetch(user.id);
            const roles = member.roles.cache;

            const failedRoles = [];

            for (const role of roles.values()) {
            try {
                const botHighestRole = message.guild.members.me.roles.highest;
                if (role.id !== message.guild.id && role.position < botHighestRole.position) {
                    await member.roles.remove(role);
                } else if (role.id !== message.guild.id) {
                    failedRoles.push(role);
                }
            } catch (error) {
                console.log("Error removing roles");
            }
            }

            if (failedRoles.length > 0) {
            failedRolesMap.set(user.id, failedRoles);
            }
        }

        if (failedRolesMap.size > 0) {
            const embed = new MessageEmbed()
            .setTitle('Failed to Remove some Roles')
            .setDescription(`I couldn't remove the following roles since they are higher in hierarchy than my highest role:`);

            failedRolesMap.forEach((roles, userId) => {
            embed.addFields({ name: ` `, value: `<@${userId}>: ${roles.map(role => `<@&${role.id}>`).join(' ')}` });
            });

            message.reply({ embeds: [embed] });
        }

        message.reply("Roles have been removed from mentioned users.");
    }

        if (message.content.startsWith("!split")) {
        const member = await message.guild.members.fetch(message.author.id);
        const mentionedUsers = message.mentions.users;
        const amount = parseInt(message.content.split(" ")[1].replace(/[.,]/g, ''));

        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && 
            !member.roles.cache.has(process.env.ECONOMY_OFFICER_ROLE_ID) && 
            !member.roles.cache.has(process.env.CONTENTCALLER_ROLE_ID)) {

            return message.reply("You do not have permission to use this command.");
        }

        if (isNaN(amount)) {
            return message.reply("Please provide a valid amount.");
        }

        if (mentionedUsers.size === 0) {
            const linkMatch = message.content.match(/https:\/\/discord\.com\/channels\/\d+\/\d+\/(\d+)/);

            if (linkMatch) {
                try {
                    const channel = await client.channels.fetch(linkMatch[0].split("/")[5]);
                    const targetMessage = await channel.messages.fetch(linkMatch[1]);
                    const mentionedInTarget = targetMessage.mentions.users;

                    if (mentionedInTarget.size === 0) {
                        return message.reply("No users mentioned in the linked message.");
                    }

                    mentionedInTarget.forEach(user => {
                        payMember(user.id, amount);
                    });

                    message.reply("Payment was successful.");
                    
                    const logChannel = await client.channels.fetch(process.env.LOGS_CHANNEL_ID);
                    const embed = new MessageEmbed()
                        .setTitle('Lootsplit Payment')
                        .setDescription(`Split payment of **${amount}** to ${[...mentionedInTarget.values()].map(user => user.toString()).join(' ')}`)
                        .setColor(0x00FF00);

                    logChannel.send({ embeds: [embed] });

                } catch (error) {
                    return message.reply("Could not fetch the linked message. Please ensure it's a valid link.");
                }
            } else {
                return message.reply("Please mention users or provide a link to a message.");
            }
        } else {
            mentionedUsers.forEach(user => {
                payMember(user.id, amount);
            });

            message.reply("Payment was successful.");

            const logChannel = await client.channels.fetch(process.env.LOGS_CHANNEL_ID);
            const embed = new MessageEmbed()
                .setTitle('Lootsplit Payment')
                .setDescription(`Split payment of **${amount}** to ${[...mentionedUsers.values()].map(user => user.toString()).join(' ')}`)
                .setColor(0x00FF00);

            logChannel.send({ embeds: [embed] });
        }
    }


    if(message.content.startsWith("--ticket_init_regear")) {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !member.roles.cache.has(process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }
        const embed = new MessageEmbed()
            .setTitle('REGEAR')
            .setDescription(GLOBALS.RegearTicketPanelDescription)
            .addFields(
                { name: ' ', value: GLOBALS.RegearTicketPanelField1 },
                { name: '**RULES**', value: GLOBALS.RegearTicketPanelField2 }
            )
            .setColor(0x00FF00);

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('open_ticket_regear')
            .setLabel('Open Ticket')
            .setStyle('Success'),
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
    if(message.content.startsWith("--ticket_init_drama")) {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !member.roles.cache.has(process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }

        const embed = new MessageEmbed()
            .setTitle('WORLD BOSS ACCESS')
            .setDescription(GLOBALS.WorldbossTicketPanelDescription)
            .addFields(
                { name: 'REQUIREMENTS', value: GLOBALS.WorldbossTicketPanelField1 }
            )
            .setColor(0xFF0000);


        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_drama')
                .setLabel('Open Ticket')
                .setStyle('Danger'),
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
    if(message.content.startsWith("--ticket_init_issues")) {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !member.roles.cache.has(process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }

        const embed = new MessageEmbed()
            .setTitle('ISSUES & SUGGESTIONS')
            .setDescription(GLOBALS.IssuesTicketPanelDescription)
            .addFields(
                { name: ' ', value: GLOBALS.IssuesTicketPanelField1 }
            )
            .setColor(0xFFFF00);


        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_issues')
                .setLabel('Open Ticket')
                .setStyle('Secondary'),
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
    if(message.content.startsWith("--ticket_init_apply")) {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !member.roles.cache.has(process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }

        const embed = new MessageEmbed()
            .setTitle('WHY NOT Application')
            .setDescription(GLOBALS.ApplicationTicketPanelDescription)
            .addFields(
                { name: 'REQUIREMENTS EU', value: GLOBALS.ApplicationTicketPanelField1 }
            )
            .addFields(
                { name: ' ', value: GLOBALS.ApplicationTicketPanelField2 }
            )
            .setColor(0xFF0000);


        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_apply')
                .setLabel('Open Ticket')
                .setStyle('Secondary'),
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
    if(message.content.startsWith("--ticket_init_leech")) {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !member.roles.cache.has(process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }

        const embed = new MessageEmbed()
            .setTitle('Leech Ticket')
            .setDescription(GLOBALS.LeechTicketPanel)
            .setColor(0x0000FF);


        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_leech')
                .setLabel('Open Ticket')
                .setStyle('Secondary'),
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
    if(message.content.startsWith("--ticket_init_renting")) {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !member.roles.cache.has(process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }

        const embed = new MessageEmbed()
            .setTitle('Renting Ticket')
            .setDescription(GLOBALS.RentingTicketPanel)
            .setColor(0x00FF00);

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_renting')
                .setLabel('Open Ticket')
                .setStyle('Secondary'),
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
    if(message.content.startsWith("--ticket_init_diplomacy")) {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !member.roles.cache.has(process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }

        const embed = new MessageEmbed()
            .setTitle('Diplomacy Ticket')
            .setDescription(GLOBALS.DiplomacyTicketPanel)
            .setColor(0x0000FF);

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_diplomacy')
                .setLabel('Open Ticket')
                .setStyle('Secondary'),
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
});



client.once("ready", async () => {
    console.log("Bot is online");
    client.user.setActivity("Albion Online", "PLAYING");
    Plusones.setClient(client);
    signupHandler.setClient(client);

    try {
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
        guild.members.fetch()
    } catch {
        console.log("No members found!")
    }

    client.guilds.cache.forEach((guild) => {
        deployCommandsForGuild(guild.id);
    });

    const channel = await client.channels.fetch(process.env.REWARD_CHANNEL);
    const messages = await channel.messages.fetch({ limit: 100 });

    setInterval(checkGiveawayEndTime, 1000); // Check every minute
});

// Function to check giveaway end time
async function checkGiveawayEndTime() {
    const giveawayDataPath = path.join(__dirname, 'data/giveawayData.json');
    if (fs.existsSync(giveawayDataPath)) {
        const giveawayData = JSON.parse(fs.readFileSync(giveawayDataPath, 'utf8'));
        const currentTime = new Date().getTime();
        for (let giveaway in giveawayData) {
            if (giveawayData[giveaway].active && giveawayData[giveaway].endTime && currentTime > new Date(giveawayData[giveaway].endTime).getTime()) {
                // roll the giveaway
                giveawayData[giveaway].active = false;
                fs.writeFileSync(giveawayDataPath, JSON.stringify(giveawayData, null, 2));
                const messageId = giveawayData[giveaway].messageId;
                const giveawaychannel = await client.channels.fetch(giveawayData[giveaway].channelId);
                            const winnersCount = giveawayData[giveaway].winnersCount || 1;
                            const plusonesWeight = 1; // Adjust this factor to change the impact of +1 entries
                
                            if (!giveawayData[messageId]) return;
                
                            const channel = await client.channels.fetch(giveawayData[messageId].channelId);
                            const message = await channel.messages.fetch(giveawayData[messageId].messageId);
                
                            const users = await message.reactions.cache.get('🎉').users.fetch();
                            const participants = users.filter(user => !user.bot);
                
                            // Load plusones data
                            const plusonesDataFile = path.join(__dirname, '../data/plusones.json');
                            let plusonesData = {};
                            if (fs.existsSync(plusonesDataFile)) {
                                try {
                                    const data = fs.readFileSync(plusonesDataFile);
                                    plusonesData = data.length ? JSON.parse(data) : {};
                                } catch (error) {
                                    console.error('Error parsing plusones data:', error);
                                    plusonesData = {};
                                }
                            }
                
                            // Create an array with weighted participants
                            let weightedParticipants = [];
                            participants.forEach(user => {
                                const plusones = plusonesData[user.id] ? plusonesData[user.id].length : 0;
                                const weight = 1 + Math.floor(plusones * plusonesWeight);
                                console.log(`${user.username} has ${plusones} +1s and a weight of ${weight}`);
                                for (let i = 0; i < weight; i++) {
                                    weightedParticipants.push(user);
                                }
                            });
                
                            if (weightedParticipants.length === 0) {
                                return giveawaychannel.send('No valid participants, no winners can be chosen.');
                            }
                
                            const winners = [];
                            for (let i = 0; i < winnersCount; i++) {
                                if (weightedParticipants.length === 0) break;
                                const winner = weightedParticipants.splice(Math.floor(Math.random() * weightedParticipants.length), 1)[0];
                                winners.push(winner);
                            }
                
                            if (winners.length === 0) {
                                return giveawaychannel.send('No valid participants, no winners can be chosen.');
                            }
                
                            const winnersList = winners.map(user => user.toString()).join(', ');
                
                            giveawaychannel.send(`Congratulations ${winnersList}! You won the giveaway!`)
            }
        }
    }
}

// cron job for 2-week statsTrack

cron.schedule('0 2 * * 1', () => {
    operateWeeklyStatsTrack()
})

cron.schedule('0 * * * *', () => {
    checkForGuildmembers();
});

function operateWeeklyStatsTrack() {
    const statusFilePath = path.join(__dirname, './data/jobStatus.json');
    const jobStatus = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
    
    if(jobStatus === 0) {
        fs.writeFileSync(statusFilePath, JSON.stringify(1, null, 2));
    } else if(jobStatus === 1) {
        fs.writeFileSync(statusFilePath, JSON.stringify(0, null, 2));
        calcStats(client)
    }
}

// ERROR HANDLING
const logFilePath = path.join(__dirname, 'logs.txt');

function logError(error) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${error.stack || error}\n\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error("Failed to write to log file:", err);
    });
}

process.on('uncaughtException', (error) => {
    console.error("Uncaught Exception:", error);
    logError(error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("Unhandled Promise Rejection:", reason);
    logError(reason);
});
// END OF ERROR HANDLING

client.on("interactionCreate", async (interaction) => {
    if (
        interaction.isButton() &&
        (
            interaction.customId.startsWith('purge_') ||
            interaction.customId.startsWith('ignore_') ||
            interaction.customId.startsWith('kick_')
        )
        ) {
        const [action, discordId] = interaction.customId.split('_');

        const userPath = path.join(__dirname, './data/users', `${discordId}.json`);
        if (!fs.existsSync(userPath)) {
            return interaction.reply({ content: `User file not found for ${discordId}.`, ephemeral: true });
        }

        const userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
        const member = await interaction.guild.members.fetch(discordId).catch(() => null);

        if (action === 'purge') {
            try {
                let hadWBRole = false;

                if (member) {
                    const rolesToRemove = member.roles.cache.filter(role => role.editable && role.id !== interaction.guild.id);
                    hadWBRole = member.roles.cache.has(process.env.WB_ROLE);
                    await member.roles.remove(rolesToRemove);

                    const rolesToAdd = [process.env.FRIEND_ROLE_ID];
                    if (hadWBRole) {
                        rolesToAdd.unshift(process.env.WBFRIEND_ROLE_ID);
                    }

                    await member.roles.add(rolesToAdd);
                }

                fs.unlinkSync(userPath);

                await interaction.reply({
                    content: member
                        ? `All roles were removed from <@${discordId}>. ${hadWBRole ? 'WB Friend role' : 'Friend role'} was added and their user file has been deleted.`
                        : `User <@${discordId}> is no longer in the server, but their file has been deleted.`,
                    ephemeral: true
                });
            } catch (err) {
                console.error(`Error while purging user:`, err);
                await interaction.reply({
                    content: `Failed to purge user: ${err.message}`,
                    ephemeral: true
                });
            }
        }


        else if (action === 'kick') {
            try {
            if (member) {
                await member.kick('No longer in the guild');
            }
            fs.unlinkSync(userPath);
            await interaction.reply({
                content: member
                ? `<@${discordId}> was kicked and their user file has been deleted.`
                : `User <@${discordId}> was already gone, but their file has been deleted.`,
                ephemeral: true
            });
            } catch (err) {
            console.error(`Error while kicking user:`, err);
            await interaction.reply({
                content: `Failed to kick or delete user file: ${err.message}`,
                ephemeral: true
            });
            }
        }

        else if (action === 'ignore') {
            try {
            userData.ignoreCheck = true;
            fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
            await interaction.reply({
                content: `<@${discordId}> will now be ignored during future guild checks.`,
                ephemeral: true
            });
            } catch (err) {
            console.error(`Error updating user file:`, err);
            await interaction.reply({
                content: `Failed to update user file: ${err.message}`,
                ephemeral: true
            });
            }
        }
    }


    if (interaction.isButton() && interaction.customId === 'show_results') {
        const messageId = interaction.message.id;

        const dataPath = path.join(__dirname, './data/iqtest.json');
        let results = [];

        try {
            results = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        } catch (err) {
            console.error('Failed to read iqtest.json:', err);
        }

        const testResult = results.find(entry => entry.messageId === messageId);

        if (!testResult) {
            return interaction.reply({ content: 'No result data found for this message.', ephemeral: true });
        }

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

        const embed = new MessageEmbed()
            .setTitle('IQ Test Results')
            .setColor(0x3498db);

        questions.forEach((q, index) => {
            const selected = testResult.answers[index];
            const isCorrect = selected === q.correct;
            embed.addFields({
            name: `Q${index + 1}: ${q.question}`,
            value: `Answer: ${q.choices[selected]} ${isCorrect ? '✅' : '❌'}`,
            inline: false
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
    if (interaction.isButton() && interaction.customId.startsWith('open_ticket')) {
        await interaction.deferReply({ ephemeral: true });

        Ticketsystem.createTicket(interaction);
        return;
    }
    
    if (interaction.isButton() && interaction.customId === 'delete_ticket') {
        await interaction.deferUpdate();

        const thread = interaction.channel;
        if (thread.isThread()) {
            thread.delete().catch(console.error);
        }
        return;
    }
    
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const thread = interaction.channel;
        
        if (thread.isThread()) {
            try {
                await thread.setLocked(true);
                await thread.setArchived(true);

                await interaction.editReply({ content: "Ticket has been closed successfully!", ephemeral: true });
            } catch (error) {
                console.error("Error closing ticket:", error);
                await interaction.editReply({ content: "Failed to close the ticket.", ephemeral: true });
            }
        }
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'signupModal') {
        //await interaction.deferUpdate({ ephemeral: true });
        await processSignup(interaction);
        return;
    }
    
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (command) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.log(error);
            if (interaction.deferred || interaction.replied) {
                interaction.editReply({content: "ERROR trying to execute the command!", ephemeral: true});
            }
        }
    }
});

async function deployCommandsForGuild(guildId) {
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v9");

    const commands = [];
    const commandFiles = fs
        .readdirSync("./src/commands")
        .filter((file) => file.endsWith(".js"));

    commandFiles.forEach((commandFile) => {
        const command = require(`./commands/${commandFile}`);
const axios = require('axios');
        commands.push(command.data.toJSON());
    });

    const restClient = new REST({ version: "9" }).setToken(process.env.DISCORD_BOT_TOKEN);

    try {
        await restClient.put(
            Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, guildId),
            { body: commands }
        );
        console.log(`Successfully registered commands for guild: ${guildId}`);
    } catch (error) {
        console.error(`Error registering commands for guild ${guildId}:`, error);
    }
}

client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = {
    client
};