const fs = require("fs");
const path = require("path");

function addRatPlus(userId, date) {
    const dataFilePath = path.join(__dirname, './data/plusones.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    let time = new Date().getTime();

    if (!data[userId]) {
        data[userId] = [];
    }

    data[userId].push({ date, time });

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    
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

module.exports = {
    addRatPlus,
    addCtaPlus,
    getRatPlus,
    getCtaPlus
};