const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

function setupMusicPlayer(client) {
    // Initialize Discord-Player
    const player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });

    // Load default extractors (YouTube, SoundCloud, Spotify, etc.)
    player.extractors.loadMulti(DefaultExtractors);

    // Expose player globally on the client
    client.player = player;

    // ── Player Events ──
    player.events.on('playerStart', (queue, track) => {
        const msg = buildNowPlayingMessage(queue, track);
        if (queue.metadata?.channel) {
            queue.metadata.channel.send(msg).catch(() => {});
        }
        setVoiceStatus(client, queue.connection?.joinConfig?.channelId || queue.channel?.id, `🎵 ${track.title.substring(0, 45) || 'Playing music'}`);
    });

    player.events.on('audioError', (queue, error) => {
        console.error(`  ❌ [MUSIC] Audio Error:`, error.message);
    });

    player.events.on('error', (queue, error) => {
        console.error(`  ❌ [MUSIC] Queue Error:`, error.message);
    });

    player.events.on('emptyQueue', (queue) => {
        if (queue.metadata?.channel) {
            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setDescription('🏁 Queue finished! Add more songs or I\'ll leave soon.');
            queue.metadata.channel.send({ embeds: [embed] }).catch(() => {});
        }
        setVoiceStatus(client, queue.connection?.joinConfig?.channelId || queue.channel?.id, '');
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
