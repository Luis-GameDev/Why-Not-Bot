const fs = require("fs");
const path = require("path");

let clientInstance;

function setClient(client) {
    clientInstance = client;
}

function addRatPlus(userId, date) {
    const dataFilePath = path.join(__dirname, './data/plusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    let time = new Date().getTime();

    if (!data[userId]) {
        data[userId] = [];
    }

    data[userId].push({ date, time });

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    updateUserName(userId);
    
    return data[userId].length; // returns total amount of +1s
}

function addCtaPlus(userId, caller) {
    const dataFilePath = path.join(__dirname, './data/ctaplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    let time = new Date().getTime();

    if (!data[userId]) {
        data[userId] = [];
    }

    data[userId].push({ time, caller });

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    updateUserName(userId);
    
    return data[userId].length; // returns total amount of +1s
}

function addContentPlus(userId, caller) {
    const dataFilePath = path.join(__dirname, './data/contentplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    let time = new Date().getTime();

    if (!data[userId]) {
        data[userId] = [];
    }

    data[userId].push({ time, caller });

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    updateUserName(userId);
    
    return data[userId].length; // returns total amount of +1s
}

function getRatPlus(userId) {
    const dataFilePath = path.join(__dirname, './data/plusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    return data[userId] || []
}

function getCtaPlus(userId) {
    const dataFilePath = path.join(__dirname, './data/ctaplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    return data[userId] || []
}

function getContentPlus(userId) {
    const dataFilePath = path.join(__dirname, './data/contentplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    return data[userId] || []
}

async function updateUserName(userId) {
    const guild = await clientInstance.guilds.fetch(process.env.DISCORD_GUILD_ID).catch(() => null);
    if (!guild) return;

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    const points = (getRatPlus(userId).length * 3) + (getCtaPlus(userId).length * 2) + (getContentPlus(userId).length);

    const nameWithoutBrackets = member.displayName.replace(/\[\d+\]$/, '').trim(); // Remove existing [number] if present
    try {
        await member.setNickname(`${nameWithoutBrackets} [${points}]`).catch(console.error);
    } catch (error) {
        console.error("Error updating nickname for: " + userId);
    }
    
}



module.exports = {
    addRatPlus,
    addCtaPlus,
    addContentPlus,
    getRatPlus,
    getCtaPlus,
    getContentPlus,
    updateUserName,
    setClient
};