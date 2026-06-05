const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

function buildNowPlayingButtons(queue) {
    const isPaused = queue.player.paused;
    const loopEmoji = { off: '🚫', track: '🔂', queue: '🔁' };

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('np_pause')
            .setEmoji(isPaused ? '▶️' : '⏸️')
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('np_skip')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('np_stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('np_loop')
            .setEmoji(loopEmoji[queue.loop] || '🚫')
            .setLabel(queue.loop === 'off' ? 'Loop' : queue.loop === 'track' ? 'Track' : 'Queue')
            .setStyle(queue.loop === 'off' ? ButtonStyle.Secondary : ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('np_shuffle')
            .setEmoji('🔀')
            .setStyle(ButtonStyle.Secondary)
    );

    return [row1];
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
        this.activeFilter = null;
        this.nowPlayingMessage = null;
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

            // Disable buttons on the old Now Playing message
            this._disableNowPlayingButtons(q);

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

                // If 24/7, stay in channel
                if (q.is247) return;

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
            
            const q = this.get(guildId);
            if (q) {
                // If 24/7, try to reconnect instead of leaving
                if (q.is247) {
                    console.log(`  ♾️ [DEBUG] 24/7 mode — attempting reconnect for guild ${guildId}`);
                    try {
                        const newPlayer = await this.client.shoukaku.joinVoiceChannel({
                            guildId: guildId,
                            channelId: q.voiceChannelId,
                            shardId: 0,
                            deaf: true,
                        });
                        q.player = newPlayer;
                        this._setupEvents(guildId, q);
                        console.log(`  ✅ [DEBUG] 24/7 reconnected for guild ${guildId}`);
                    } catch (err) {
                        console.error(`  ❌ [DEBUG] 24/7 reconnect failed:`, err.message);
                        try {
                            await this.client.rest.put(
                                `/channels/${q.voiceChannelId}/voice-status`,
                                { body: { status: "" } }
                            );
                        } catch {}
                        this.delete(guildId);
                    }
                    return;
                }

                // Clear VC status
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

    async _disableNowPlayingButtons(queue) {
        if (!queue.nowPlayingMessage) return;
        try {
            const msg = queue.nowPlayingMessage;
            const disabledRows = msg.components.map(row => {
                const newRow = ActionRowBuilder.from(row);
                newRow.components.forEach(btn => btn.setDisabled(true));
                return newRow;
            });
            await msg.edit({ components: disabledRows });
        } catch {}
        queue.nowPlayingMessage = null;
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

            const buttons = buildNowPlayingButtons(queue);
            const msg = await ch.send({ embeds: [embed], components: buttons });
            queue.nowPlayingMessage = msg;

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

module.exports = { QueueManager, formatDuration, progressBar, buildNowPlayingButtons };
