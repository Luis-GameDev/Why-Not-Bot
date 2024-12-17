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
    ],
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
