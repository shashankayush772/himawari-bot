const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');

// ── MongoDB Connection ─────────────────────────────────────
let db = null;
let collection = null;
let cachedData = null;

async function connectMongo() {
    if (db) return; // Already connected
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('  ⚠️ [YT-LIVE] MONGODB_URI not set! Data will NOT persist across restarts.');
        return;
    }
    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db('himawari');
        collection = db.collection('ytnotify');
        console.log('  ✅ [YT-LIVE] Connected to MongoDB');
    } catch (err) {
        console.error('  ⚠️ [YT-LIVE] MongoDB connection failed:', err.message);
    }
}

// ── Load / Save ────────────────────────────────────────────
async function loadDataAsync() {
    if (cachedData) return cachedData;
    
    await connectMongo();
    if (collection) {
        try {
            const doc = await collection.findOne({ _id: 'ytnotify_data' });
            if (doc) {
                cachedData = { guilds: doc.guilds || {}, notified: doc.notified || [], pendingLives: doc.pendingLives || {} };
                return cachedData;
            }
        } catch (err) {
            console.error('  ⚠️ [YT-LIVE] Failed to load from MongoDB:', err.message);
        }
    }
    cachedData = { guilds: {}, notified: [], pendingLives: {} };
    return cachedData;
}

async function saveDataAsync(data) {
    cachedData = data;
    
    await connectMongo();
    if (collection) {
        try {
            await collection.updateOne(
                { _id: 'ytnotify_data' },
                { $set: { guilds: data.guilds, notified: data.notified, pendingLives: data.pendingLives } },
                { upsert: true }
            );
        } catch (err) {
            console.error('  ⚠️ [YT-LIVE] Failed to save to MongoDB:', err.message);
        }
    }
}

// Synchronous wrappers for backward compatibility (used by ytnotify.js command)
// These work because the data is cached in memory after first async load
function loadData() {
    if (cachedData) return cachedData;
    // If not loaded yet, return empty (will be loaded async on first poll)
    return { guilds: {}, notified: [], pendingLives: {} };
}

function saveData(data) {
    cachedData = data;
    // Fire-and-forget async save to MongoDB
    saveDataAsync(data).catch(err => console.error('  ⚠️ [YT-LIVE] Background save failed:', err.message));
}

// ── Extract Channel ID from URL ────────────────────────────
async function resolveChannelId(input) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error('  ⚠️ [YT-LIVE] YOUTUBE_API_KEY is not set!');
        return null;
    }

    try {
        let query = input;
        // If it's a direct URL, extract the handle or channel ID to search
        if (input.includes('youtube.com/')) {
            const match = input.match(/(?:youtube\.com\/(?:@|c\/|channel\/))([^/?]+)/);
            if (match) query = match[1];
        }

        // Use YouTube API Search endpoint to find the channel
        const resp = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: 'snippet',
                type: 'channel',
                q: query,
                key: apiKey
            }
        });

        if (resp.data.items && resp.data.items.length > 0) {
            const channel = resp.data.items[0];
            return { 
                id: channel.snippet.channelId, 
                name: channel.snippet.channelTitle || channel.snippet.title 
            };
        }
    } catch (err) {
        console.error('  ⚠️ [YT-LIVE] API Channel Resolve Error:', err.response?.data || err.message);
    }
    return null;
}

// ── Fetch latest videos for a channel using API ──────────────
async function fetchRSS(channelId) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return [];

    try {
        const playlistId = channelId.replace(/^UC/, 'UU');
        const resp = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
            params: {
                part: 'snippet',
                playlistId: playlistId,
                maxResults: 5,
                key: apiKey
            }
        });

        const entries = [];
        if (resp.data.items) {
            for (const item of resp.data.items) {
                const snippet = item.snippet;
                const videoId = snippet.resourceId.videoId;
                if (videoId) {
                    entries.push({
                        videoId: videoId,
                        title: snippet.title,
                        published: snippet.publishedAt,
                        authorName: snippet.channelTitle,
                        thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
                    });
                }
            }
        }
        return entries;
    } catch (err) {
        console.error(`  ⚠️ [YT-LIVE] API fetch latest videos failed for ${channelId}:`, err.response?.data || err.message);
        return [];
    }
}

// ── Check if a video is currently LIVE ─────────────────────
async function checkIfLive(videoId) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return { isLiveNow: false, isUpcoming: false, viewers: null };

    try {
        const resp = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'snippet,liveStreamingDetails',
                id: videoId,
                key: apiKey
            }
        });

        if (resp.data.items && resp.data.items.length > 0) {
            const video = resp.data.items[0];
            const isLive = video.snippet.liveBroadcastContent === 'live';
            const isUpcoming = video.snippet.liveBroadcastContent === 'upcoming';
            const viewers = video.liveStreamingDetails?.concurrentViewers 
                ? parseInt(video.liveStreamingDetails.concurrentViewers) 
                : null;
                
            return { isLiveNow: isLive, isUpcoming, viewers };
        }
        return { isLiveNow: false, isUpcoming: false, viewers: null };
    } catch (err) {
        console.error(`  ⚠️ [YT-LIVE] API Live check failed for ${videoId}:`, err.response?.data || err.message);
        return { isLiveNow: false, isUpcoming: false, viewers: null };
    }
}

// ── Send notification embed ────────────────────────────────
async function sendLiveNotification(client, discordChannelId, entry, mentionRole, customMessage) {
    try {
        const channel = await client.channels.fetch(discordChannelId);
        if (!channel) return;

        const streamUrl = `https://www.youtube.com/watch?v=${entry.videoId}`;

        // Build the message content
        let messageText;
        if (customMessage) {
            // Use custom message — replace {link} with the actual URL
            messageText = customMessage.replace(/\{link\}/gi, streamUrl);
            // If user didn't include {link}, append it at the end
            if (!messageText.includes(streamUrl)) {
                messageText += `\n${streamUrl}`;
            }
        } else {
            // Use random cute messages as default
            const cuteMessages = [
                `OMG! 🎀 **${entry.authorName}** is live right now! Come watch! ✨\n${streamUrl}`,
                `Popcorn time! 🍿 **${entry.authorName}** just started streaming! 💖\n${streamUrl}`,
                `Hurry up! 🏃‍♀️ **${entry.authorName}** is LIVE! Don't miss it! 🎮\n${streamUrl}`,
                `A wild livestream appeared! 🌟 Catch **${entry.authorName}** live right now! 🎉\n${streamUrl}`,
                `Grab your snacks! 🍪 **${entry.authorName}** is officially LIVE! 🎈\n${streamUrl}`
            ];
            messageText = cuteMessages[Math.floor(Math.random() * cuteMessages.length)];
        }

        // Discord @everyone role ID is the same as the guild ID. We must use literal "@everyone" to ping it.
        let mention = '';
        if (mentionRole) {
            if (mentionRole === channel.guild.id) {
                mention = '@everyone';
            } else {
                mention = `<@&${mentionRole}>`;
            }
        }

        const finalContent = mention ? `${mention}\n${messageText}` : messageText;
        await channel.send({ content: finalContent });
        console.log(`  📺 [YT-LIVE] Sent live notification for "${entry.title}" by ${entry.authorName}`);
    } catch (err) {
        console.error(`  ⚠️ [YT-LIVE] Failed to send notification:`, err.message);
    }
}

// ── Main polling loop ──────────────────────────────────────
async function pollYouTubeLive(client) {
    const data = await loadDataAsync();
    let changed = false;

    // Keep notified list manageable (max 500 entries)
    if (data.notified.length > 500) {
        data.notified = data.notified.slice(-200);
        changed = true;
    }

    for (const [guildId, guildConfig] of Object.entries(data.guilds)) {
        if (!guildConfig.tracks || guildConfig.tracks.length === 0) continue;

        for (const track of guildConfig.tracks) {
            try {
                const entries = await fetchRSS(track.channelId);
                if (entries.length === 0) continue;

                // Check the latest 5 entries for new live streams
                for (const entry of entries.slice(0, 5)) {
                    const notifKey = `${guildId}:${entry.videoId}`;

                    // Already notified
                    if (data.notified.includes(notifKey)) continue;

                    // Check if this video is live
                    const { isLiveNow, isUpcoming } = await checkIfLive(entry.videoId);

                    if (isLiveNow) {
                        // It's live! Send notification
                        await sendLiveNotification(client, track.discordChannelId, entry, track.mentionRole, guildConfig.customMessage);
                        data.notified.push(notifKey);
                        changed = true;
                    } else if (isUpcoming) {
                        // Scheduled but not live yet — store as pending
                        if (!data.pendingLives[notifKey]) {
                            data.pendingLives[notifKey] = {
                                videoId: entry.videoId,
                                channelId: track.channelId,
                                discordChannelId: track.discordChannelId,
                                mentionRole: track.mentionRole,
                                title: entry.title,
                                authorName: entry.authorName,
                                thumbnail: entry.thumbnail,
                            };
                            changed = true;
                            console.log(`  ⏳ [YT-LIVE] Scheduled live detected: "${entry.title}" — waiting for it to start`);
                        }
                    }

                    // Small delay between video checks to avoid rate limits
                    await new Promise(r => setTimeout(r, 1500));
                }
            } catch (err) {
                console.error(`  ⚠️ [YT-LIVE] Error polling ${track.channelId}:`, err.message);
            }
        }
    }

    // Check pending lives (scheduled streams that haven't started yet)
    for (const [notifKey, pending] of Object.entries(data.pendingLives || {})) {
        if (data.notified.includes(notifKey)) {
            delete data.pendingLives[notifKey];
            changed = true;
            continue;
        }

        try {
            const { isLiveNow } = await checkIfLive(pending.videoId);
            if (isLiveNow) {
                // Find the guild config for this pending notification to get customMessage
                const pendingGuildId = notifKey.split(':')[0];
                const pendingGuildConfig = data.guilds[pendingGuildId];
                await sendLiveNotification(client, pending.discordChannelId, pending, pending.mentionRole, pendingGuildConfig?.customMessage);
                data.notified.push(notifKey);
                delete data.pendingLives[notifKey];
                changed = true;
            }
            await new Promise(r => setTimeout(r, 1500));
        } catch {}
    }

    if (changed) await saveDataAsync(data);
}

// ── Start the monitor ──────────────────────────────────────
async function startYouTubeLiveMonitor(client) {
    // Pre-load data from MongoDB on startup
    await loadDataAsync();
    console.log('  📺 [YT-LIVE] Monitor started (polling every 2 minutes)');

    // Initial poll after 30 seconds (let bot finish starting)
    setTimeout(() => pollYouTubeLive(client), 30_000);

    // Then poll every 10 minutes (600,000 ms) to save API quota
    setInterval(() => pollYouTubeLive(client), 600_000);
}

module.exports = { loadData, saveData, loadDataAsync, saveDataAsync, resolveChannelId, startYouTubeLiveMonitor };
