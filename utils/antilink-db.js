const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;
let antilinkCollection;

// Map of GuildID -> Config for quick lookups
const antilinkCache = new Map();

const defaultConfig = {
    enabled: false,
    whitelistedChannels: [],
    whitelistedRoles: []
};

async function connectToMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('  ⚠️ [ANTI-LINK] MONGODB_URI not set! Configs will not save.');
        return;
    }

    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db('himawari_bot');
        antilinkCollection = db.collection('antilink_configs');
        
        console.log('  ✅ [ANTI-LINK] Connected to MongoDB');

        // Pre-load all configs into cache
        const configs = await antilinkCollection.find({}).toArray();
        for (const config of configs) {
            antilinkCache.set(config.guildId, config);
        }
        console.log(`  ✅ [ANTI-LINK] Cached ${configs.length} configs`);
    } catch (err) {
        console.error('  ⚠️ [ANTI-LINK] MongoDB connection failed:', err.message);
    }
}

// Ensure connection starts
connectToMongo();

function getConfig(guildId) {
    return antilinkCache.get(guildId) || { ...defaultConfig };
}

async function setEnabled(guildId, enabled) {
    let config = antilinkCache.get(guildId) || { ...defaultConfig };
    config.enabled = enabled;
    antilinkCache.set(guildId, config);

    if (antilinkCollection) {
        await antilinkCollection.updateOne(
            { guildId },
            { $set: { enabled } },
            { upsert: true }
        );
    }
    return config;
}

async function toggleWhitelistChannel(guildId, channelId) {
    let config = antilinkCache.get(guildId) || { ...defaultConfig };
    
    // Ensure arrays exist
    if (!config.whitelistedChannels) config.whitelistedChannels = [];
    
    const index = config.whitelistedChannels.indexOf(channelId);
    let added = false;
    if (index > -1) {
        config.whitelistedChannels.splice(index, 1);
    } else {
        config.whitelistedChannels.push(channelId);
        added = true;
    }
    
    antilinkCache.set(guildId, config);

    if (antilinkCollection) {
        await antilinkCollection.updateOne(
            { guildId },
            { $set: { whitelistedChannels: config.whitelistedChannels } },
            { upsert: true }
        );
    }
    return added;
}

async function toggleWhitelistRole(guildId, roleId) {
    let config = antilinkCache.get(guildId) || { ...defaultConfig };
    
    // Ensure arrays exist
    if (!config.whitelistedRoles) config.whitelistedRoles = [];
    
    const index = config.whitelistedRoles.indexOf(roleId);
    let added = false;
    if (index > -1) {
        config.whitelistedRoles.splice(index, 1);
    } else {
        config.whitelistedRoles.push(roleId);
        added = true;
    }
    
    antilinkCache.set(guildId, config);

    if (antilinkCollection) {
        await antilinkCollection.updateOne(
            { guildId },
            { $set: { whitelistedRoles: config.whitelistedRoles } },
            { upsert: true }
        );
    }
    return added;
}

module.exports = {
    getConfig,
    setEnabled,
    toggleWhitelistChannel,
    toggleWhitelistRole
};
