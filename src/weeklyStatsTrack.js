const fs = require("fs");
const axios = require("axios");
const DISCORD_MINIMUM_FAME = 50000000;

async function calculateWeeklyStats(client) {
    const apiUrl = 'https://gameinfo-ams.albiononline.com/api/gameinfo/players/';

    const usersDir = "./src/data/users";
    const userFiles = fs.readdirSync(usersDir).filter(file => file.endsWith('.json'));
    const results = [];

    for (const file of userFiles) {
        const filePath = `${usersDir}/${file}`;
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const discordId = userData.discordId;
        const playerId = userData.playerId;
        const previousStats = userData.weeklyStats || [];

        try {
            const response = await axios.get(`${apiUrl}${playerId}`);
            const currentFame = response.data.LifetimeStatistics.PvE.Total;
            const currentDate = new Date().toISOString().split('T')[0];

            if (previousStats.length > 0) {
                const lastEntry = previousStats[previousStats.length - 1];
                const fameDifference = currentFame - lastEntry.fame;

                results.push({ discordId, fame: fameDifference });
            } else {
                results.push({ discordId, fame: 'No data' });
            }

            previousStats.push({ date: currentDate, fame: currentFame });
            userData.weeklyStats = previousStats;
            fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
        } catch (error) {
            console.error(`Error fetching stats for player ID: ${playerId}`, error.message);
        }
    }

    results.sort((a, b) => {
        if (typeof a.fame === 'number' && typeof b.fame === 'number') {
            return b.fame - a.fame;
        } else {
            return (a.fame === 'No data') ? 1 : -1;
        }
    });

    const message = results.map(user => {
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        const member = guild?.members.cache.get(user.discordId); 
        if (!member) return; 
    
        if (user.fame !== 'No data') {
            const emoji = user.fame < DISCORD_MINIMUM_FAME ? '❌' : '✔️';
    
            // Filter for WB-member
            if (!member.roles.cache.has(process.env.WB_ROLE)) return;
    
            return `<@${user.discordId}>: ${user.fame.toLocaleString("de-DE")} Fame ${emoji}`;
        } else {
            // Filter for WB-member
            if (!member.roles.cache.has(process.env.WB_ROLE)) return;
    
            return `<@${user.discordId}>: No data`;
        }
    }).filter(Boolean).join('\n');

    let channel = client.channels.cache.get("1314680152588026020");
    channel.send("# Weekly Fame Report: #\n" + message);
}

module.exports = calculateWeeklyStats;
