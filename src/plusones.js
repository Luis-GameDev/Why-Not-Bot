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

function addCtaManuallyPlus(userId, caller, link) {
    const dataFilePath = path.join(__dirname, './data/ctaplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    let time = new Date().getTime();

    if (!data[userId]) {
        data[userId] = [];
    }

    data[userId].push({ time, caller, link });

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

function addFocusPlus(userId) {
    const dataFilePath = path.join(__dirname, './data/focusplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    let time = new Date().getTime();

    if (!data[userId]) {
        data[userId] = [];
    }

    data[userId].push({ time });

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    updateUserName(userId);
    
    return data[userId].length; // returns total amount of +1s
}

function addVodPlus(userId, reviewer) {
    const dataFilePath = path.join(__dirname, './data/vodplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    let time = new Date().getTime();

    if (!data[userId]) {
        data[userId] = [];
    }

    data[userId].push({ time, reviewer });

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    updateUserName(userId);
    
    return data[userId].length; // returns total amount of +1s
}

function addScoutPlus(userId, date) {
    const dataFilePath = path.join(__dirname, './data/scoutplusones.json');
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

function getFocusPlus(userId) {
    const dataFilePath = path.join(__dirname, './data/focusplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    return data[userId] || []
}

function getVodPlus(userId) {
    const dataFilePath = path.join(__dirname, './data/vodplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    return data[userId] || []
}

function getScoutPlus(userId) {
    const dataFilePath = path.join(__dirname, './data/scoutplusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    return data[userId] || []
}

async function updateUserName(userId) {
    const guild = await clientInstance.guilds.fetch(process.env.DISCORD_GUILD_ID).catch(() => null);
    if (!guild) return;

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    const points = (getRatPlus(userId).length * 2) + (getCtaPlus(userId).length * 5) + (getContentPlus(userId).length) + (getFocusPlus(userId).length * 2) + (getVodPlus(userId).length) + (getScoutPlus(userId).length);

    if(points >= 35 && member.roles.cache.has(process.env.TRIAL_ROLE_ID)) {
        await member.roles.remove(process.env.TRIAL_ROLE_ID).catch(console.error);
    }

    const nameWithoutBrackets = member.displayName.replace(/\[\d+\]$/, '').trim(); 
    try {
        await member.setNickname(`${nameWithoutBrackets} [${points}]`).catch(console.error);
    } catch (error) {
        console.error("Error updating nickname for: " + userId);
    }   
}



module.exports = {
    addRatPlus,
    addCtaPlus,
    addCtaManuallyPlus,
    addContentPlus,
    addFocusPlus,
    addVodPlus,
    addScoutPlus,
    getRatPlus,
    getCtaPlus,
    getContentPlus,
    getFocusPlus,
    getVodPlus,
    getScoutPlus,
    updateUserName,
    setClient
};