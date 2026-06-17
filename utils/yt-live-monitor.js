const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');
const { EmbedBuilder } = require('discord.js');

const DATA_FILE = path.join(__dirname, '..', 'data', 'ytnotify.json');

// ── Load / Save ────────────────────────────────────────────
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('  ⚠️ [YT-LIVE] Failed to load data:', err.message);
    }
    return { guilds: {}, notified: [], pendingLives: {} };
}

function saveData(data) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('  ⚠️ [YT-LIVE] Failed to save data:', err.message);
    }
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

// ── Fetch RSS feed for a channel ───────────────────────────
async function fetchRSS(channelId) {
    try {
        const resp = await axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const xml = resp.data;

        // Simple XML parsing — extract video entries
        const entries = [];
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        while ((match = entryRegex.exec(xml)) !== null) {
            const entry = match[1];
            const videoId = entry.match(/<yt:videoId>([\w-]+)<\/yt:videoId>/)?.[1];
            const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
            const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1];
            const authorName = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/)?.[1];
            const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null;

            if (videoId) {
                entries.push({ videoId, title, published, authorName, thumbnail });
            }
        }
        return entries;
    } catch (err) {
        console.error(`  ⚠️ [YT-LIVE] RSS fetch failed for ${channelId}:`, err.message);
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
async function sendLiveNotification(client, discordChannelId, entry, mentionRole) {
    try {
        const channel = await client.channels.fetch(discordChannelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setAuthor({ name: `${entry.authorName}`, iconURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.authorName)}&background=ff0000&color=fff` })
            .setTitle(`🔴 ${entry.title}`)
            .setURL(`https://www.youtube.com/watch?v=${entry.videoId}`)
            .setDescription(`**${entry.authorName}** is now live on YouTube!`)
            .setImage(entry.thumbnail)
            .addFields(
                { name: '🔗 Watch Now', value: `**[Click here to watch](https://www.youtube.com/watch?v=${entry.videoId})**` }
            )
            .setFooter({ text: 'YouTube Live Notification' })
            .setTimestamp();

        if (entry.viewers) {
            embed.addFields({ name: '👀 Viewers', value: `${entry.viewers.toLocaleString()}`, inline: true });
        }

        const mention = mentionRole ? `<@&${mentionRole}> ` : '';
        await channel.send({ content: `${mention}🔴 **LIVE NOW!**`, embeds: [embed] });
        console.log(`  📺 [YT-LIVE] Sent live notification for "${entry.title}" by ${entry.authorName}`);
    } catch (err) {
        console.error(`  ⚠️ [YT-LIVE] Failed to send notification:`, err.message);
    }
}

// ── Main polling loop ──────────────────────────────────────
async function pollYouTubeLive(client) {
    const data = loadData();
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
                        await sendLiveNotification(client, track.discordChannelId, entry, track.mentionRole);
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
                await sendLiveNotification(client, pending.discordChannelId, pending, pending.mentionRole);
                data.notified.push(notifKey);
                delete data.pendingLives[notifKey];
                changed = true;
            }
            await new Promise(r => setTimeout(r, 1500));
        } catch {}
    }

    if (changed) saveData(data);
}

// ── Start the monitor ──────────────────────────────────────
function startYouTubeLiveMonitor(client) {
    console.log('  📺 [YT-LIVE] Monitor started (polling every 2 minutes)');

    // Initial poll after 30 seconds (let bot finish starting)
    setTimeout(() => pollYouTubeLive(client), 30_000);

    // Then poll every 2 minutes
    setInterval(() => pollYouTubeLive(client), 120_000);
}

module.exports = { loadData, saveData, resolveChannelId, startYouTubeLiveMonitor };
