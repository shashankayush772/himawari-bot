const { Player, QueryType } = require('discord-player');
const {
    SoundCloudExtractor,
    SpotifyExtractor,
    AttachmentExtractor,
    VimeoExtractor,
    ReverbnationExtractor,
    AppleMusicExtractor
} = require('@discord-player/extractor');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

function setupMusicPlayer(client) {
    // Initialize Discord-Player (no ytdlOptions — that was a v6 thing)
    const player = new Player(client);

    // ── Register extractors MANUALLY (DefaultExtractors is broken — returns nulls) ──
    (async () => {
        try {
            await player.extractors.register(SoundCloudExtractor, {});
            console.log('  ✅ [MUSIC] Registered: SoundCloudExtractor');
        } catch (e) { console.error('  ❌ [MUSIC] Failed to register SoundCloudExtractor:', e.message); }

        try {
            await player.extractors.register(AttachmentExtractor, {});
            console.log('  ✅ [MUSIC] Registered: AttachmentExtractor');
        } catch (e) { console.error('  ❌ [MUSIC] Failed to register AttachmentExtractor:', e.message); }

        try {
            await player.extractors.register(SpotifyExtractor, {});
            console.log('  ✅ [MUSIC] Registered: SpotifyExtractor');
        } catch (e) { console.error('  ❌ [MUSIC] Failed to register SpotifyExtractor:', e.message); }

        try {
            await player.extractors.register(VimeoExtractor, {});
            console.log('  ✅ [MUSIC] Registered: VimeoExtractor');
        } catch (e) { console.error('  ❌ [MUSIC] Failed to register VimeoExtractor:', e.message); }

        try {
            await player.extractors.register(ReverbnationExtractor, {});
            console.log('  ✅ [MUSIC] Registered: ReverbnationExtractor');
        } catch (e) { console.error('  ❌ [MUSIC] Failed to register ReverbnationExtractor:', e.message); }

        try {
            await player.extractors.register(AppleMusicExtractor, {});
            console.log('  ✅ [MUSIC] Registered: AppleMusicExtractor');
        } catch (e) { console.error('  ❌ [MUSIC] Failed to register AppleMusicExtractor:', e.message); }

        console.log(`  ✅ [MUSIC] Total extractors loaded: ${player.extractors.size}`);
    })();

    // Expose player globally on the client
    client.player = player;

    // ── Player Events ──
    player.events.on('playerStart', (queue, track) => {
        console.log(`  🎵 [MUSIC] Now playing: ${track.title} (${track.duration})`);
        const msg = buildNowPlayingMessage(queue, track);
        if (queue.metadata?.channel) {
            queue.metadata.channel.send(msg).catch(() => {});
        }
        try {
            const channelId = queue.dispatcher?.voiceConnection?.joinConfig?.channelId || queue.channel?.id;
            if (channelId) setVoiceStatus(client, channelId, `🎵 ${track.title.substring(0, 45) || 'Playing music'}`);
        } catch (e) {}
    });

    player.events.on('audioTrackAdd', (queue, track) => {
        console.log(`  📋 [MUSIC] Track added to queue: ${track.title}`);
    });

    player.events.on('playerSkip', (queue, track) => {
        console.error(`  ⚠️ [MUSIC] SKIPPED (could not extract stream): ${track.title} — URL: ${track.url}`);
        if (queue.metadata?.channel) {
            queue.metadata.channel.send({
                embeds: [new EmbedBuilder()
                    .setColor(0xED4245)
                    .setDescription(`⚠️ Skipped **${track.title}** — could not extract audio stream. Try a different song or a direct SoundCloud URL.`)]
            }).catch(() => {});
        }
    });

    player.events.on('playerError', (queue, error, track) => {
        console.error(`  ❌ [MUSIC] Player error on "${track?.title}":`, error.message);
        if (queue.metadata?.channel) {
            queue.metadata.channel.send({
                embeds: [new EmbedBuilder()
                    .setColor(0xED4245)
                    .setDescription(`❌ Error playing **${track?.title || 'unknown'}**: ${error.message}`)]
            }).catch(() => {});
        }
    });

    player.events.on('error', (queue, error) => {
        console.error(`  ❌ [MUSIC] Queue Error:`, error.message);
    });

    player.events.on('emptyQueue', (queue) => {
        console.log('  🏁 [MUSIC] Queue empty');
        if (queue.metadata?.channel) {
            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setDescription('🏁 Queue finished! Add more songs or I\'ll leave soon.');
            queue.metadata.channel.send({ embeds: [embed] }).catch(() => {});
        }
        try {
            const channelId = queue.dispatcher?.voiceConnection?.joinConfig?.channelId || queue.channel?.id;
            if (channelId) setVoiceStatus(client, channelId, '');
        } catch (e) {}
    });

    player.events.on('debug', (queue, message) => {
        // Only log important debug messages, not every heartbeat
        if (message.includes('error') || message.includes('Error') || message.includes('skip') || message.includes('idle') || message.includes('buffering')) {
            console.log(`  🐛 [QUEUE DEBUG] ${message}`);
        }
    });

    // ── Handle Button Interactions ──
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        if (!interaction.customId.startsWith('music_')) return;

        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true }).catch(() => {});
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.channel.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true }).catch(() => {});
        }

        try {
            // ── Filter Dropdown ──
            if (interaction.isStringSelectMenu() && interaction.customId === 'music_filter') {
                const filter = interaction.values[0];
                if (filter === 'clear') {
                    queue.filters.ffmpeg.setFilters(false);
                    return interaction.reply({ content: '🎛️ All filters cleared!', ephemeral: true });
                }
                
                queue.filters.ffmpeg.toggle(filter);
                return interaction.reply({ content: `🎛️ Filter **${filter}** toggled!`, ephemeral: true });
            }

            // ── Button Controls ──
            switch (interaction.customId) {
                case 'music_previous':
                    const history = queue.history;
                    if (history.previousTrack) {
                        await history.previous();
                        await interaction.reply({ content: '⏮️ Playing previous song!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: '❌ No previous song in history!', ephemeral: true });
                    }
                    break;

                case 'music_pause':
                    queue.node.setPaused(!queue.node.isPaused());
                    await interaction.reply({ content: queue.node.isPaused() ? '⏸️ Paused!' : '▶️ Resumed!', ephemeral: true });
                    break;

                case 'music_shuffle':
                    queue.tracks.shuffle();
                    await interaction.reply({ content: '🔀 Queue shuffled!', ephemeral: true });
                    break;

                case 'music_skip':
                    queue.node.skip();
                    await interaction.reply({ content: '⏭️ Skipped!', ephemeral: true });
                    break;

                case 'music_loop':
                    const modes = [0, 1, 2]; // OFF, TRACK, QUEUE
                    const currentLoop = queue.repeatMode;
                    const nextLoop = modes[(currentLoop + 1) % 3];
                    queue.setRepeatMode(nextLoop);
                    const displayModes = ['Off', '🔂 Song Loop', '🔁 Queue Loop'];
                    await interaction.reply({ content: `🔁 Loop: **${displayModes[nextLoop]}**`, ephemeral: true });
                    break;

                case 'music_voldown':
                    const downVol = Math.max(0, queue.node.volume - 10);
                    queue.node.setVolume(downVol);
                    await interaction.reply({ content: `🔉 Volume: **${downVol}%**`, ephemeral: true });
                    break;

                case 'music_volup':
                    const upVol = Math.min(100, queue.node.volume + 10);
                    queue.node.setVolume(upVol);
                    await interaction.reply({ content: `🔊 Volume: **${upVol}%**`, ephemeral: true });
                    break;

                case 'music_stop':
                    queue.delete();
                    await interaction.reply({ content: '⏹️ Stopped and disconnected!', ephemeral: true });
                    break;
            }
        } catch (err) {
            console.error('  ❌ [MUSIC] Button error:', err.message);
            interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true }).catch(() => {});
        }
    });

    console.log('  ✅ [MUSIC] Discord-Player initialized!');
    return player;
}

// ── Voice Status Helper ──
async function setVoiceStatus(client, channelId, statusText) {
    if (!channelId) return;
    try {
        const channel = client.channels.cache.get(channelId);
        if (channel && channel.isVoiceBased() && channel.guild.members.me.permissions.has('SetVoiceChannelStatus')) {
            await channel.setVoiceStatus(statusText);
        }
    } catch (e) {
        // Ignore errors
    }
}

// ── Now Playing UI ──
function buildNowPlayingMessage(queue, track) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎶 Now Playing')
        .setDescription(`[**${track.title}**](${track.url})`)
        .addFields(
            { name: '👤 Requester', value: track.requestedBy ? `<@${track.requestedBy.id}>` : 'Unknown', inline: true },
            { name: '⏱️ Duration', value: track.duration || 'Live', inline: true },
            { name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true }
        );

    if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
    }

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_previous').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_pause').setEmoji('⏯️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_voldown').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_volup').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary)
    );

    const filterMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('music_filter')
            .setPlaceholder('🎛️ Select an Audio Filter')
            .addOptions([
                { label: 'Clear Filters', value: 'clear', emoji: '✖️' },
                { label: 'Bassboost', value: 'bassboost', emoji: '🔊' },
                { label: 'Nightcore', value: 'nightcore', emoji: '🌃' },
                { label: 'Vaporwave', value: 'vaporwave', emoji: '🌌' },
                { label: '8D Audio', value: '8D', emoji: '🎧' },
                { label: 'Karaoke', value: 'karaoke', emoji: '🎤' },
                { label: 'Tremolo', value: 'tremolo', emoji: '〰️' }
            ])
    );

    return { embeds: [embed], components: [row1, row2, filterMenu] };
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function createProgressBar(current, total, length = 15) {
    if (total === 0) return '🔘' + '▬'.repeat(length - 1);
    const progress = Math.round((current / total) * length);
    const emptyProgress = length - progress;
    const progressText = '▬'.repeat(progress - 1 > 0 ? progress - 1 : 0);
    const emptyProgressText = '▬'.repeat(emptyProgress > 0 ? emptyProgress : 0);
    return progressText + '🔘' + emptyProgressText;
}

module.exports = { setupMusicPlayer, buildNowPlayingMessage, formatDuration, createProgressBar };
