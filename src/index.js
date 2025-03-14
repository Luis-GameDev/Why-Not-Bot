require("dotenv").config();
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const calcStats = require("./weeklyStatsTrack.js");
const Plusones = require("./plusones.js");
const Ticketsystem = require("./ticketsystem.js");
const axios = require('axios');
const { Client: UnbClient } = require('unb-api');
const balanceBotAPI = new UnbClient(process.env.BALANCE_BOT_API_KEY);
const { processSignup } = require('./signupHandler.js');

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
        Partials.Reaction
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

client.on("guildMemberAdd", async (member) => {
    if (member.guild.id !== process.env.DISCORD_GUILD_ID) return;
    
    const publicChannel = await client.channels.fetch(process.env.PUBLIC_CHANNEL_ID);
    await member.roles.add(process.env.NOTLINKED_ROLE_ID).catch(console.error);
    publicChannel.send(`Welcome ${member}!\n
If you joined the guild please follow the instructions pinned here https://discord.com/channels/1248205717379354664/1330900761302929418 to link your account and get full permissions. \n
Once linked, please read https://discord.com/channels/1248205717379354664/1248250430283190273 and https://discord.com/channels/1248205717379354664/1267166145618640957`);
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
    

    let greenCore = {payment: 50000, reaction: "🟢", name: "Green Core in Lowland"};
    let blueCore = {payment: 75000, reaction: "🔵", name: "Blue Core in Lowland"};
    let purpleCore = {payment: 150000, reaction: "🟣", name: "Purple Core in Lowland"};
    let goldCore = {payment: 300000, reaction: "🟡", name: "Gold Core in Lowland"};
    
    let greenVortex = {payment: 150000, reaction: "🟩", name: "Green Vortex"};
    let blueVortex = {payment: 250000, reaction: "🟦", name: "Blue Vortex"};
    let purpleVortex = {payment: 500000, reaction: "🟪", name: "Purple Vortex"};
    let goldVortex = {payment: 750000, reaction: "🟨", name: "Gold Vortex"};

    let greenCoreRavine = {payment: 100000, reaction: "💚", name: "Green Core in Ravine"};
    let blueCoreRavine = {payment: 150000, reaction: "💙", name: "Blue Core in Ravine"};
    let purpleCoreRavine = {payment: 300000, reaction: "💜", name: "Purple Core in Ravine"};
    let goldCoreRavine = {payment: 500000, reaction: "💛", name: "Gold Core in Ravine"};

    if (reaction.message.channel.id === process.env.REWARD_CHANNEL && !user.bot) {

        const member = await reaction.message.guild.members.fetch(user.id);

        const checkmarkReaction = reaction.message.reactions.cache.find(r => r.emoji.name === "✅");
        if (checkmarkReaction) return;

        switch (reaction.emoji.name) {
            case greenCore.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${greenCore.payment}** for securing the ${greenCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, greenCore.payment);
            break;

            case blueCore.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${blueCore.payment}** for securing the ${blueCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, blueCore.payment);
            break;

            case purpleCore.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${purpleCore.payment}** for securing the ${purpleCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, purpleCore.payment);
            break;

            case goldCore.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${goldCore.payment}** for securing the ${goldCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, goldCore.payment);
            break;

            case greenVortex.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${greenVortex.payment}** for securing the ${greenVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, greenVortex.payment);
            break;

            case blueVortex.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${blueVortex.payment}** for securing the ${blueVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, blueVortex.payment);
            break;

            case purpleVortex.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${purpleVortex.payment}** for securing the ${purpleVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, purpleVortex.payment);
            break;

            case goldVortex.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${goldVortex.payment}** for securing the ${goldVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, goldVortex.payment);
            break;

            case greenCoreRavine.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${greenCoreRavine.payment}** for securing the ${greenCoreRavine.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, greenCoreRavine.payment);
            break;

            case blueCoreRavine.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${blueCoreRavine.payment}** for securing the ${blueCoreRavine.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, blueCoreRavine.payment);
            break;

            case purpleCoreRavine.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${purpleCoreRavine.payment}** for securing the ${purpleCoreRavine.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, purpleCoreRavine.payment);
            break;

            case goldCoreRavine.reaction:
                if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
                    reaction.message.channel.send(`You do not have permission to reward players <@${user.id}>.`);
                    return;
                }
            originalMessage.reply(`You have received **${goldCoreRavine.payment}** for securing the ${goldCoreRavine.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, goldCoreRavine.payment);
            break;

            default:
            break;
        }
    }
});

client.on("messageCreate", async (message) => {

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
            return message.reply("No users mentioned.");
        }
    
        const logChannel = await client.channels.fetch(process.env.LOGS_CHANNEL_ID);
        
        mentionedUsers.forEach(user => {
            payMember(user.id, amount);
        });

        message.reply("Payment was successful.");
    
        const embed = new MessageEmbed()
            .setTitle('Lootsplit Payment')
            .setDescription(`Split payment of **${message.content.split(" ")[1]}** to ${[...mentionedUsers.values()].map(user => user.toString()).join(' ')}`)
            .setColor(0x00FF00);
    
        logChannel.send({ embeds: [embed] });
    }
    

    if(message.content.startsWith("--ticket_init_regear")) {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID) && !member.roles.cache.has(process.env.RECRUITMENTDISCORD_OFFICER_ROLE_ID)) {
            return message.reply("You do not have permission to use this command.");
        }
        const embed = new MessageEmbed()
            .setTitle('REGEAR')
            .setDescription('Click the button below to open a regear ticket in case you died during a regearable content session! Make sure to send a screenshot of the death and specify the below information...')
            .addFields(
                { name: ' ', value: '- Content \n - Caller \n - Time of Death (UTC)' },
                { name: '**RULES**', value: '1. Only approved builds will be regarded.\n2. If the regear ticket is opened after 24hrs has passed from the actual death, the regear will be denied.\n3. All regears must be withdrawn from chest within 24hrs from when the Regear Officer posted your regear chest.' }
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
            .setDescription('In order to access World Boss content or solve WB related issues, please open a ticket sending the below information.')
            .addFields(
                { name: 'REQUIREMENTS', value: '- Ability and willingness to scout and rat. \n- Screenshot on 100 spec on weapon and offhand or 100 spec armor if offtank. \n- Good english understanding and speaking in order to provide information from scout and be understood by the party. \n- Vouch of WB Member (not mandatory) \n- Willing to rat in case its needed. The rat presence is tracked by the guild. \n- Deposit of a Cautional Fee of 10 million silver. \n- Willingness to do at least 50m PVE fame each 14 days (equivalent fame amount of 2 hrs of WB). \n\nCautional Fee is NOT a payment: Its a caution we ask to ensure good behavior and rules abiding.\nYou will recieve the 10 million cautional fee if all the following conditions are met:\n1) You did not get kicked from the guild and you didnt systematically break rules\n2) Asked a WB Officer to have the fee back before leaving. We are humans, we cant and wont chase you. Officers are humans playing a game in their free time and for fun. Please respect that.' }
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
            .setDescription('Click the button below to open a ticket. Make sure to follow the below format and be patient for your reply from the officer that will handle your ticket!')
            .addFields(
                { name: ' ', value: '- Type: \"Issue/Suggestion/Point system\"\n- Description: \"A description of your thoughts on the matter\"' }
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
            .setDescription('Click on the button below to apply for membership in WHY NOT!')
            .addFields(
                { name: 'REQUIREMENTS EU', value: '- 60m pve fame\n- 20m pvp fame (exceptions can be made if vods are provided)\n- IGN + Screenshot of your Characters Stats (EU)\n- Ability to play 2 pvp roles and to record your game.\n- Speaking English, being able to join Voice channels and follow calls\n- Willingness to learn, improve, behave correctly with other people and be part of our community. We do not like guild hoppers / leechers.' }
            )
            .addFields(
                { name: ' ', value: '(If you are thinking of the applying in the guild just so you can fame up on World Boss and then logout till the next World Boss session save yourself the trouble of applying. We do not need World Boss slaves but people that are interested on doing content and dive into our community)'}
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
});



client.once("ready", async () => {
    console.log("Bot is online");
    client.user.setActivity("Albion Online", "PLAYING");
    Plusones.setClient(client);

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

// Cron job to archive channels every day at midnight if the archive process was not done (in case the bot was offline, need to fix that later)

cron.schedule('0 0 * * *', async () => {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    const archivedCategory = guild.channels.cache.get(process.env.DISCORD_ARCHIVED_CATEGORY_ID);

    if (!archivedCategory) {
        console.error("Archived category not found");
        return;
    }

    guild.channels.cache.forEach(channel => {
        if (channel.name.startsWith("archived") && channel.parentId !== process.env.DISCORD_ARCHIVED_CATEGORY_ID) {
            channel.setParent(process.env.DISCORD_ARCHIVED_CATEGORY_ID).catch(console.error);
        }
    });
});

// cron job for 2-week statsTrack

cron.schedule('0 2 * * 1', () => {
    operateWeeklyStatsTrack()
})

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

module.exports = client;