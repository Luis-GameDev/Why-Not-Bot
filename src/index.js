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

const plusOneFilePath = path.join(__dirname, 'data', 'plusones.json');
const botChannelId = process.env.BOT_CHANNEL; 

function loadPlusOnes() {
    if (fs.existsSync(plusOneFilePath)) {
        return JSON.parse(fs.readFileSync(plusOneFilePath, 'utf8'));
    } else {
        return {}; 
    }
}

function savePlusOnes(plusOnes) {
    fs.writeFileSync(plusOneFilePath, JSON.stringify(plusOnes, null, 2));
}

client.once("ready", () => {
    console.log("Bot is online");
    client.user.setActivity("Albion Online", "PLAYING");
});

client.on("messageCreate", async (message) => {
    // will be replaced by a cron-job once it works
    if (message.content === "--stats") {
        calcStats(client);
    }

    if (message.channel.id === botChannelId && message.content === "+1" && !message.author.bot) {
        const userId = message.author.id;
        const plusOnes = loadPlusOnes(); 

        if (!plusOnes[userId]) {
            plusOnes[userId] = 0;
        }

        plusOnes[userId] += 1;

        savePlusOnes(plusOnes);

        message.reply(`<@${message.author.id}>, you now have **${plusOnes[userId]}** +1s.`);
    }
});

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

client.login(process.env.DISCORD_BOT_TOKEN);
