const { EmbedBuilder } = require('discord.js');

function formatDuration(ms) {
    if (!ms || ms === 0) return '🔴 LIVE';
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;
}

function progressBar(current, total, length = 20) {
    if (!total) return '▬'.repeat(length);
    const filled = Math.min(Math.round((current / total) * length), length);
    return '▬'.repeat(filled) + '🔘' + '▬'.repeat(Math.max(length - filled - 1, 0));
}

class GuildQueue {
    constructor({ textChannelId, voiceChannelId, player }) {
        this.textChannelId = textChannelId;
        this.voiceChannelId = voiceChannelId;
        this.player = player;
        this.tracks = [];
        this.current = null;
        this.loop = 'off'; // 'off' | 'track' | 'queue'
        this.volume = 80;
        this.is247 = false;
    }
}

class QueueManager {
    constructor(client) {
        this.client = client;
        this.queues = new Map();
    }

    get(guildId) {
        return this.queues.get(guildId);
    }

    create(guildId, options) {
        const queue = new GuildQueue(options);
        this.queues.set(guildId, queue);
        this._setupEvents(guildId, queue);
        return queue;
    }

    delete(guildId) {
        this.queues.delete(guildId);
    }

    _setupEvents(guildId, queue) {
        const player = queue.player;

        player.on('start', (data) => {
            console.log(`  🎶 [DEBUG] Track started in guild ${guildId}`);
        });

        player.on('end', async (data) => {
            console.log(`  🔚 [DEBUG] Track ended in guild ${guildId}, reason: ${data.reason}`);
            if (data.reason === 'replaced') return;
            const q = this.get(guildId);
            if (!q) return;

            // Loop: track
            if (q.loop === 'track' && q.current) {
                player.playTrack({ track: { encoded: q.current.encoded } });
                return;
            }
            // Loop: queue → push current to back
            if (q.loop === 'queue' && q.current) {
                q.tracks.push(q.current);
            }

            // Play next
            if (q.tracks.length > 0) {
                q.current = q.tracks.shift();
                player.playTrack({ track: { encoded: q.current.encoded } });
                this._sendNowPlaying(q);
            } else {
                q.current = null;

                // Clear VC status
                try {
                    await this.client.rest.put(
                        `/channels/${q.voiceChannelId}/voice-status`,
                        { body: { status: "" } }
                    );
                } catch {}

                // Auto-leave after 5 min idle
                setTimeout(async () => {
                    const check = this.get(guildId);
                    if (check && !check.current && check.tracks.length === 0 && !check.is247) {
                        try { await this.client.shoukaku.leaveVoiceChannel(guildId); } catch {}
                        this.delete(guildId);
                        try {
                            const ch = await this.client.channels.fetch(check.textChannelId);
                            ch.send('👋 Left the voice channel due to inactivity. (Use `/247` to disable auto-leave)');
                        } catch {}
                    }
                }, 300_000);
            }
        });

        player.on('stuck', async (data) => {
            console.log(`  ⚠️ [DEBUG] Track stuck in guild ${guildId}`, data);
            const q = this.get(guildId);
            if (!q) return;
            try {
                const ch = await this.client.channels.fetch(q.textChannelId);
                ch.send('⚠️ Track got stuck — skipping...');
            } catch {}
        });

        player.on('closed', async (data) => {
            console.log(`  🔒 [DEBUG] Player closed in guild ${guildId}`, data);
            
            // Clear VC status if possible
            const q = this.get(guildId);
            if (q) {
                try {
                    await this.client.rest.put(
                        `/channels/${q.voiceChannelId}/voice-status`,
                        { body: { status: "" } }
                    );
                } catch {}
            }

            try { await this.client.shoukaku.leaveVoiceChannel(guildId); } catch {}
            this.delete(guildId);
        });
    }

    async _sendNowPlaying(queue) {
        try {
            const ch = await this.client.channels.fetch(queue.textChannelId);
            const t = queue.current.info;
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setAuthor({ name: '🎵 Now Playing' })
                .setTitle(t.title)
                .setURL(t.uri)
                .addFields(
                    { name: '👤 Artist', value: t.author || 'Unknown', inline: true },
                    { name: '⏱️ Duration', value: formatDuration(t.length), inline: true }
                )
                .setThumbnail(t.artworkUrl || null)
                .setTimestamp();
            ch.send({ embeds: [embed] });

            // Set Voice Channel Status
            try {
                await this.client.rest.put(
                    `/channels/${queue.voiceChannelId}/voice-status`,
                    { body: { status: `🎵 ${t.title}`.substring(0, 175) } }
                );
            } catch (err) {
                console.error(`  ⚠️ [DEBUG] Failed to set VC status:`, err.message);
            }
        } catch {}
    }
}

module.exports = { QueueManager, formatDuration, progressBar };
