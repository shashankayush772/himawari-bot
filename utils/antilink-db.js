const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'antilink.json');

function readDB() {
    if (!fs.existsSync(dbPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch {
        return {};
    }
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

function getConfig(guildId) {
    const db = readDB();
    if (!db[guildId]) {
        db[guildId] = {
            enabled: false,
            whitelistedChannels: [],
            whitelistedRoles: []
        };
        writeDB(db);
    }
    return db[guildId];
}

function setEnabled(guildId, enabled) {
    const db = readDB();
    if (!db[guildId]) {
        db[guildId] = { enabled: false, whitelistedChannels: [], whitelistedRoles: [] };
    }
    db[guildId].enabled = enabled;
    writeDB(db);
    return db[guildId];
}

function toggleWhitelistChannel(guildId, channelId) {
    const db = readDB();
    if (!db[guildId]) {
        db[guildId] = { enabled: false, whitelistedChannels: [], whitelistedRoles: [] };
    }
    
    const index = db[guildId].whitelistedChannels.indexOf(channelId);
    let added = false;
    if (index > -1) {
        db[guildId].whitelistedChannels.splice(index, 1);
    } else {
        db[guildId].whitelistedChannels.push(channelId);
        added = true;
    }
    
    writeDB(db);
    return added;
}

function toggleWhitelistRole(guildId, roleId) {
    const db = readDB();
    if (!db[guildId]) {
        db[guildId] = { enabled: false, whitelistedChannels: [], whitelistedRoles: [] };
    }
    
    const index = db[guildId].whitelistedRoles.indexOf(roleId);
    let added = false;
    if (index > -1) {
        db[guildId].whitelistedRoles.splice(index, 1);
    } else {
        db[guildId].whitelistedRoles.push(roleId);
        added = true;
    }
    
    writeDB(db);
    return added;
}

module.exports = {
    getConfig,
    setEnabled,
    toggleWhitelistChannel,
    toggleWhitelistRole
};
