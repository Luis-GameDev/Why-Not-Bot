const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'data', 'users');

function getUserFilePath(userId) {
    return path.join(USERS_PATH, `${userId}.json`);
}

function loadUserData(userId) {
    const file = getUserFilePath(userId);
    if (!fs.existsSync(file)) {
        return { voicetime: { total: 0, lastJoin: null, sessions: [] } };
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveUserData(userId, data) {
    const file = getUserFilePath(userId);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function trackVoiceTime(oldState, newState) {
    const userId = newState.id;
    const wasInVC = oldState.channelId !== null;
    const isInVC = newState.channelId !== null;

    const userData = loadUserData(userId);
    const vt = userData.voicetime || { total: 0, lastJoin: null, sessions: [] };

    if (!wasInVC && isInVC) {
        // Joined VC
        vt.lastJoin = Date.now();
    } else if (wasInVC && !isInVC && vt.lastJoin) {
        // Left VC
        const now = Date.now();
        const duration = now - vt.lastJoin;
        vt.total += duration;
        vt.sessions.push({ join: vt.lastJoin, leave: now });
        vt.lastJoin = null;
    }

    userData.voicetime = vt;
    saveUserData(userId, userData);
}

module.exports = {
    trackVoiceTime
};
