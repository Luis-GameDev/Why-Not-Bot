require("dotenv").config();
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { EmbedBuilder: MessageEmbed } = require('@discordjs/builders');
const calcStats = require("./weeklyStatsTrack.js");
const Plusones = require("./plusones.js");
const axios = require('axios');
console.log("Starting bot...");

const {
    Client,
    Collection, 
    Partials,
    GatewayIntentBits,
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

function payMember(userId, amount) {
    const guild = process.env.DISCORD_GUILD_ID;
    axios.patch(`https://unbelievaboat.com/api/v1/guilds/${guild}/users/${userId}`, {
        cash: amount,
        reason: "Why Bot Payment"
    }, {
        headers: {
            'Authorization': process.env.BALANCE_BOT_API_KEY,
            'accept': 'application/json',
            'content-type': 'application/json'
        }
    }).then(response => {
        console.log('Payment successful:', response.data);
    }).catch(error => {
        console.error('Error making payment:', error);
    });
}

client.on("guildMemberAdd", async (member) => {
    const publicChannel = await client.channels.fetch(process.env.PUBLIC_CHANNEL_ID);

    publicChannel.send(`Welcome ${member}!\n
If you joined the guild please follow the instructions pinned here https://discord.com/channels/1248205717379354664/1330900761302929418 to link your account and get full permissions. \n
Once linked, please read https://discord.com/channels/1248205717379354664/1248250430283190273 and https://discord.com/channels/1248205717379354664/1267166145618640957`);
});

client.on("messageReactionAdd", async (reaction, user) => {

    originalMessage = reaction.message;
    
    let greenCore = {payment: 100000, reaction: "🟢", name: "Green Core"};
    let blueCore = {payment: 200000, reaction: "🔵", name: "Blue Core"};
    let purpleCore = {payment: 250000, reaction: "🟣", name: "Purple Core"};
    let goldCore = {payment: 400000, reaction: "🟡", name: "Gold Core"};
    
    let greenVortex = {payment: 150000, reaction: "🟩", name: "Green Vortex"};
    let blueVortex = {payment: 250000, reaction: "🟦", name: "Blue Vortex"};
    let purpleVortex = {payment: 500000, reaction: "🟪", name: "Purple Vortex"};
    let goldVortex = {payment: 750000, reaction: "🟨", name: "Gold Vortex"};

    if (reaction.message.channel.id === process.env.REWARD_CHANNEL && !user.bot) {

        const member = await reaction.message.guild.members.fetch(user.id);

        if (!member.roles.cache.has(process.env.OFFICER_ROLE_ID)) {
            originalMessage.reply("You do not have permission to reward players.");
            return;
        }

        const checkmarkReaction = reaction.message.reactions.cache.find(r => r.emoji.name === "✅");
        if (checkmarkReaction) return;

        switch (reaction.emoji.name) {
            case greenCore.reaction:
            originalMessage.reply(`You have received **${greenCore.payment}** for securing the ${greenCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, greenCore.payment);
            break;

            case blueCore.reaction:
            originalMessage.reply(`You have received **${blueCore.payment}** for securing the ${blueCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, blueCore.payment);
            break;

            case purpleCore.reaction:
            originalMessage.reply(`You have received **${purpleCore.payment}** for securing the ${purpleCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, purpleCore.payment);
            break;

            case goldCore.reaction:
            originalMessage.reply(`You have received **${goldCore.payment}** for securing the ${goldCore.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, goldCore.payment);
            break;

            case greenVortex.reaction:
            originalMessage.reply(`You have received **${greenVortex.payment}** for securing the ${greenVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, greenVortex.payment);
            break;

            case blueVortex.reaction:
            originalMessage.reply(`You have received **${blueVortex.payment}** for securing the ${blueVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, blueVortex.payment);
            break;

            case purpleVortex.reaction:
            originalMessage.reply(`You have received **${purpleVortex.payment}** for securing the ${purpleVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, purpleVortex.payment);
            break;

            case goldVortex.reaction:
            originalMessage.reply(`You have received **${goldVortex.payment}** for securing the ${goldVortex.name}!`);
            originalMessage.react("✅");
            payMember(reaction.message.author.id, goldVortex.payment);
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
        
        message.reply(`<@${userId}>, you now have **${plusamount}** +1s.`);
    }

    if (message.content.startsWith("!wb")) {
        message.reply(`if you're interested in joining World Boss fame farm activities, you shall open a ticket in https://discord.com/channels/1248205717379354664/1274422719168909323. Requirements are the following: Ability to use a scout while fame farming. 100 spec on weapon / offhand from https://discord.com/channels/1248205717379354664/1248254004962525255 If playing DPS, higher spec might be required Vouch of WB members (not mandatory but appreciated) Willingness to rat (!rat for more info).`);
    }

    if (message.content.startsWith("!rewards")) {
        message.reply(`Guild rewards a various set of activities, like delivering Power Cores to hideout or killing enemies in Unhallowed Cloister. To check what we redeem, https://discord.com/channels/1248205717379354664/1300766799209431101. \nTo redeem rewards, you can ask any Officer.`);
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

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (command) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.log(error);
            if (interaction.deferred || interaction.replied) {
                interaction.editReply("ERROR trying to execute the command!");
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