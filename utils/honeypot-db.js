const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;
let honeypotCollection;
let statsCollection;

// Map of GuildID -> ChannelID for quick lookups without hitting the DB every message
const honeypotCache = new Map();

async function connectToMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('  ⚠️ [HONEYPOT] MONGODB_URI not set! Honeypot stats will not save.');
        return;
    }

    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db('himawari_bot');
        honeypotCollection = db.collection('honeypot_configs');
        statsCollection = db.collection('honeypot_stats');
        
        console.log('  ✅ [HONEYPOT] Connected to MongoDB');

        // Pre-load all honeypot channels into cache
        const configs = await honeypotCollection.find({}).toArray();
        for (const config of configs) {
            honeypotCache.set(config.guildId, config.channelId);
        }
        console.log(`  ✅ [HONEYPOT] Cached ${configs.length} honeypot channels`);
    } catch (err) {
        console.error('  ⚠️ [HONEYPOT] MongoDB connection failed:', err.message);
    }
}

// Ensure connection starts
connectToMongo();

async function setHoneypotChannel(guildId, channelId) {
    honeypotCache.set(guildId, channelId);
    if (!honeypotCollection) return;
    
    await honeypotCollection.updateOne(
        { guildId },
        { $set: { channelId } },
        { upsert: true }
    );
}

function getHoneypotChannel(guildId) {
    return honeypotCache.get(guildId);
}

async function incrementStats(guildId) {
    if (!statsCollection) return;

    // Increment guild-specific stats
    await statsCollection.updateOne(
        { guildId },
        { $inc: { kicks: 1 } },
        { upsert: true }
    );

    // Increment global stats (using a special ID "GLOBAL")
    await statsCollection.updateOne(
        { guildId: 'GLOBAL' },
        { $inc: { kicks: 1, totalServers: 0 } },
        { upsert: true }
    );
}

async function updateGlobalServerCount(count) {
    if (!statsCollection) return;
    try {
        await statsCollection.updateOne(
            { guildId: 'GLOBAL' },
            { $set: { totalServers: count } },
            { upsert: true }
        );
    } catch (err) {
        console.error('  ⚠️ [HONEYPOT] Failed to update global server count:', err.message);
    }
}

async function getStats(guildId) {
    const defaultStats = { serverKicks: 0, globalKicks: 0, totalServers: 0 };
    if (!statsCollection) return defaultStats;

    try {
        const serverStats = await statsCollection.findOne({ guildId });
        const globalStats = await statsCollection.findOne({ guildId: 'GLOBAL' });

        return {
            serverKicks: serverStats?.kicks || 0,
            globalKicks: globalStats?.kicks || 0,
            totalServers: globalStats?.totalServers || 0
        };
    } catch (err) {
        console.error('  ⚠️ [HONEYPOT] Failed to get stats:', err.message);
        return defaultStats;
    }
}

module.exports = {
    setHoneypotChannel,
    getHoneypotChannel,
    incrementStats,
    getStats,
    updateGlobalServerCount
};
