const fs = require("fs/promises");
const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const DISCORD_MINIMUM_FAME = 50000000;


async function calculateWeeklyStats(client) {
    const apiUrl = 'https://gameinfo-ams.albiononline.com/api/gameinfo/players/';
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    try {
        await guild.members.fetch();
        await guild.roles.fetch();
    } catch (error) {
        console.error("Error fetching guild members or roles: ", error.message);
    }

    const usersDir = "./src/data/users";
    const userFiles = fs.readdirSync(usersDir).filter(file => file.endsWith('.json'));
    const results = [];
    let channel = client.channels.cache.get(process.env.FAME_REPORT_CHANNEL);
    await channel.send(`Calculating weekly stats for ${userFiles.length} users...`);

    const promises = userFiles.map(async (file) => {
        const filePath = `${usersDir}/${file}`;
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const discordId = userData.discordId;
        const playerId = userData.playerId;
        const ign = userData.ign;

        if (!ign) return;

        const previousStats = userData.weeklyStats || [];

        try {
            const response = await axios.get(`${apiUrl}${playerId}`);
            await delay(200);
            const currentFame = response.data.LifetimeStatistics.PvE.Total;
            const currentDate = new Date().toISOString().split('T')[0];

            if (previousStats.length > 0) {
                const lastEntry = previousStats[previousStats.length - 1];
                const fameDifference = currentFame - lastEntry.fame;

                results.push({ ign, discordId, fame: fameDifference });
            } else {
                results.push({ ign, discordId, fame: 'No data' });
            }

            previousStats.push({ date: currentDate, fame: currentFame });
            userData.weeklyStats = previousStats;
            fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
        } catch (error) {
            console.error(`Error fetching stats for player ID: ${playerId}`, error.message);
        }
    });

    await Promise.all(promises);

    results.sort((a, b) => {
        if (typeof a.fame === 'number' && typeof b.fame === 'number') {
            return b.fame - a.fame;
        } else {
            return (a.fame === 'No data') ? 1 : -1;
        }
    });

    let embed = new EmbedBuilder()
        .setColor(0x1e90ff)
        .setTitle("2-week Fame Report")
        .setTimestamp();

    let currentFields = 0;
    const MAX_FIELDS = 25;

    results.forEach(user => {
        
        const member = guild?.members.cache.get(user.discordId); 
        if (!member || !member.roles.cache.has(process.env.WB_ROLE)) return;

        const fameValue = user.fame === 'No data' ? 'No data' : `${user.fame.toLocaleString("de-DE")} Fame`;
        const emoji = user.fame !== 'No data' && user.fame < DISCORD_MINIMUM_FAME ? '❌' : '✔️';

        if (currentFields >= MAX_FIELDS) {
            // Send the current embed and create a new one
            client.channels.cache.get(process.env.FAME_REPORT_CHANNEL).send({ embeds: [embed] });
            embed = new EmbedBuilder()
                .setColor(0x1e90ff)
                .setTitle("2-week Fame Report")
                .setTimestamp();
            currentFields = 0;
        }

        embed.addFields({
            name: ` `,
            value: `<@${user.discordId}> (${user.ign}) - ${fameValue} ${emoji}`,
            inline: false,
        });

        currentFields++;
    });

    if (currentFields > 0) {
        if (channel && channel.isTextBased()) {
            try {
                await channel.send({ embeds: [embed] });
            } catch (error) { "Error calculating weekly stats: ", error.message }
        }
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = calculateWeeklyStats;
