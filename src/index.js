require("dotenv").config();
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const calcStats = require("./weeklyStatsTrack.js");
console.log("Starting bot...");

const {
    Client,
    Collection,
    GatewayIntentBits,
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
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
const dataFilePath = path.join(__dirname, './data/plusones.json');

function addPlusOne(discordId, date) {
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    if (!data[discordId]) {
        data[discordId] = [];
    }

    data[discordId].push({ date });

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

function getPlusOneData(discordId) {
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    return data[discordId] || [];
}

client.on("messageCreate", async (message) => {
    // will be replaced by a cron-job once it works
    if (message.content === "--stats" && message.author.id === process.env.OWNER_USER_ID) {
        operateWeeklyStatsTrack()
    }

    if (message.channel.id === botChannelId && message.content.startsWith("+1") && !message.author.bot) {
        const userId = message.author.id;
        const parts = message.content.split(" ").slice(1);
        const inputDate = parts.join(" ").trim();

        addPlusOne(userId, inputDate)
        
        message.reply(`<@${userId}>, you now have **${getPlusOneData(userId).length}** +1s.`);
    }

    if(message.content === "!wb") {
        message.reply(`if you're interested in joining World Boss fame farm activities, you shall open a ticket in https://discord.com/channels/1248205717379354664/1274422719168909323. Requirements are the following: Ability to use a scout while fame farming. 100 spec on weapon / offhand from https://discord.com/channels/1248205717379354664/1248254004962525255 If playing DPS, higher spec might be required Vouch of WB members (not mandatory but appreciated) Willingness to rat (!rat for more info).`)
    }

    if(message.content === "!rewards") {
        message.reply(`Guild rewards a various set of activities, like delivering Power Cores to hideout or killing enemies in Unhallowed Cloister. To check what we redeem, https://discord.com/channels/1248205717379354664/1300766799209431101. \nTo redeem rewards, you can ask any Officer.`)
    }

    if(message.content === "!info") {
        message.reply(`https://discord.com/channels/1248205717379354664/1274422719168909323 = Apply for Worldboss member role / issue WB releted complains. \nhttps://discord.com/channels/1248205717379354664/1248254004962525255 = Why not builds for WB \nhttps://discord.com/channels/1248205717379354664/1319310140222079006 = DPS and other tutorials made by our members. Follow these to get GOOD at your weapon and learn your rotations for WB. \nhttps://discord.com/channels/1248205717379354664/1267166145618640957 = NAPs \n"How to redeem balance? 💸 " - Contact any officer that is online and request your Discord Balance.`)
    }

    if(message.content === "!complain") {
        message.reply(`If you have something to say or to complain about, you can open a ticket here https://discord.com/channels/1248205717379354664/1281971928231444490 \nOnly Overseers will be able to read it, so don't worry if you have an issue with an officer or caller.`)
    }

    if(message.content === "!rat") {
        message.reply(`Ratting in WB means coming with an approved #"Guccirats" set or a T4 Rat set from Rat Gear tab in hideout bank and defend the worldboss from enemies trying to kill our pve party by knocking them into mobs / invis bombing / diving with SS gear. Usually once enemies are spotted, someone pings in https://discord.com/channels/1248205717379354664/1270502535702118400 or https://discord.com/channels/1229028530990350366/1229028531019841615 \n Once you came to defend the party, you can type \"+1 [Link of the call message]\" here: https://discord.com/channels/1248205717379354664/1316458591699341344 to have your participation counted by the bot.`)
    }

    if(message.content === "!regears") {
        message.reply(`PVP Activity regear: T7 gear T8 Weapon. OC break included. Consumables / mounts not included. Ask caller to be sure. WB Regears: https://discord.com/channels/1248205717379354664/1250066776335843389`)
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
    
});

client.once("ready", () => {
    console.log("Bot is online");
    client.user.setActivity("Albion Online", "PLAYING");

    try {
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
        guild.members.fetch()
    } catch {
        console.log("No members found!")
    }

    client.guilds.cache.forEach((guild) => {
        deployCommandsForGuild(guild.id);
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
