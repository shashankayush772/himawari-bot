const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DisTube = require('distube').default;
const { joinVoiceChannel } = require('@discordjs/voice');

// ── Set Voice Channel Status (shows current song in VC) ──
async function setVoiceStatus(client, channelId, status) {
    if (!channelId) return;
    try {
        await client.rest.put(`/channels/${channelId}/voice-status`, {
            body: { status: status || '' }
        });
    } catch (err) {
        // Silently fail — some servers may not support VC status
        console.warn('  ⚠️ [MUSIC] Could not set VC status:', err.message);
    }
}

// ── Format seconds to MM:SS ──
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ── Create a progress bar ──
function createProgressBar(current, total, length = 12) {
    if (!total || total === 0) return '🔘' + '▬'.repeat(length - 1);
    const progress = Math.round((current / total) * length);
    const before = '▬'.repeat(Math.max(0, progress));
    const after = '▬'.repeat(Math.max(0, length - progress - 1));
    return before + '🔘' + after;
}

// ── Build the Now Playing embed with buttons ──
function buildNowPlayingMessage(queue, song) {
    const currentTime = queue.currentTime || 0;
    const totalTime = song.duration || 0;
    const progressBar = createProgressBar(currentTime, totalTime);

    const loopModes = ['Off', '🔂 Song', '🔁 Queue'];
    const loopText = loopModes[queue.repeatMode] || 'Off';

    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setAuthor({ name: '🎵 Now Playing...' })
        .setTitle(song.name || 'Unknown Track')
        .setURL(song.url || '')
        .setThumbnail(song.thumbnail || null)
        .addFields(
            { name: '\u200b', value: `${progressBar}\n⏱️ \`${formatDuration(currentTime)} / ${formatDuration(totalTime)}\``, inline: false },
            { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
            { name: '🔁 Loop', value: loopText, inline: true },
            { name: '📋 Queue', value: `${queue.songs.length - 1} in queue`, inline: true },
        )
        .setFooter({ text: `Requested by ${song.user?.globalName || song.user?.username || 'Unknown'}`, iconURL: song.user?.displayAvatarURL?.() || undefined })
        .setTimestamp();

    // ── Filter Dropdown ──
    const filterMenu = new StringSelectMenuBuilder()
        .setCustomId('music_filter')
        .setPlaceholder('🎛️ Select a filter...')
        .addOptions([
            { label: '❌ Clear Filters', value: 'clear', description: 'Remove all audio filters' },
            { label: '🔊 Bass Boost', value: 'bassboost', description: 'Heavy bass boost' },
            { label: '🌙 Nightcore', value: 'nightcore', description: 'Speed up + higher pitch' },
            { label: '🌊 Vaporwave', value: 'vaporwave', description: 'Slow down + lower pitch' },
            { label: '🎧 8D Audio', value: '3d', description: 'Surround sound effect' },
            { label: '🎤 Karaoke', value: 'karaoke', description: 'Remove vocals' },
            { label: '📢 Earrape', value: 'earrape', description: 'Extreme volume boost' },
            { label: '🔔 Tremolo', value: 'tremolo', description: 'Wobbling volume effect' },
            { label: '🎵 Flanger', value: 'flanger', description: 'Jet engine swoosh effect' },
        ]);

    const filterRow = new ActionRowBuilder().addComponents(filterMenu);

    // ── Control Buttons Row 1 ──
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_previous').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_pause').setEmoji(queue.paused ? '▶️' : '⏸️').setStyle(queue.paused ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
    );

    // ── Control Buttons Row 2 ──
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(queue.repeatMode ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_voldown').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_volup').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
    );

    return { embeds: [embed], components: [filterRow, row1, row2] };
}

// ── Initialize DisTube on the client ──
function setupMusicPlayer(client) {
    const ffmpegPath = require('ffmpeg-static');
    const { YouTubePlugin } = require('@distube/youtube');

    const distube = new DisTube(client, {
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        ffmpeg: {
            path: ffmpegPath
        },
        plugins: [
            new YouTubePlugin()
        ]
    });

    client.distube = distube;

    // ── DisTube Events ──

    distube.on('playSong', (queue, song) => {
        const msg = buildNowPlayingMessage(queue, song);
        queue.textChannel?.send(msg).catch(() => {});

        // Set VC status to show current song
        setVoiceStatus(client, queue.voiceChannel?.id, `🎵 ${song.name?.substring(0, 45) || 'Playing music'}`);
    });

    distube.on('addSong', (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setAuthor({ name: '📋 Added to Queue' })
            .setTitle(song.name || 'Unknown')
            .setURL(song.url)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '⏱️ Duration', value: formatDuration(song.duration), inline: true },
                { name: '📋 Position', value: `#${queue.songs.length}`, inline: true },
            )
            .setFooter({ text: `Requested by ${song.user?.globalName || song.user?.username || 'Unknown'}` });

        queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    });

    distube.on('addList', (queue, playlist) => {
        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setAuthor({ name: '📋 Added Playlist to Queue' })
            .setTitle(playlist.name || 'Unknown Playlist')
            .setURL(playlist.url)
            .setThumbnail(playlist.thumbnail)
            .addFields(
                { name: '🎵 Songs', value: `${playlist.songs.length}`, inline: true },
                { name: '⏱️ Duration', value: formatDuration(playlist.duration), inline: true },
            )
            .setFooter({ text: `Requested by ${playlist.songs[0]?.user?.globalName || 'Unknown'}` });

        queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    });

    distube.on('finish', (queue) => {
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription('🏁 Queue finished! Add more songs or I\'ll leave in 30 seconds.');

        queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
        setVoiceStatus(client, queue.voiceChannel?.id, '');
    });

    distube.on('disconnect', (queue) => {
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription('👋 Disconnected from voice channel. See you next time!');

        queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
        setVoiceStatus(client, queue.voiceChannel?.id, '');
    });

    distube.on('error', (channel, error) => {
        console.error('  ❌ [MUSIC] DisTube error:', error.message);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setDescription(`❌ Music error: ${error.message}`);
            channel.send({ embeds: [embed] }).catch(() => {});
        }
    });

    distube.on('empty', (queue) => {
        // Check if 24/7 mode is enabled for this guild
        const cmd247 = client.commands?.get('247');
        if (cmd247 && cmd247.is247Enabled(queue.id)) {
            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setDescription('📭 Voice channel is empty, but **24/7 mode** is on — I\'m staying! 🔄');
            queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
            return; // Don't leave
        }

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setDescription('📭 Voice channel is empty! Leaving in 30 seconds...');

        queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    });

    // ── Handle Button Interactions ──
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        if (!interaction.customId.startsWith('music_')) return;

        const queue = distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true }).catch(() => {});
        }

        // Check if user is in the same voice channel
        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.voiceChannel?.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true }).catch(() => {});
        }

        try {
            // ── Filter Dropdown ──
            if (interaction.isStringSelectMenu() && interaction.customId === 'music_filter') {
                const filter = interaction.values[0];
                if (filter === 'clear') {
                    if (queue.filters.names.length > 0) {
                        await queue.filters.clear();
                    }
                    return interaction.reply({ content: '🎛️ All filters cleared!', ephemeral: true });
                }
                if (queue.filters.has(filter)) {
                    await queue.filters.remove(filter);
                    return interaction.reply({ content: `🎛️ Filter **${filter}** removed!`, ephemeral: true });
                } else {
                    await queue.filters.add(filter);
                    return interaction.reply({ content: `🎛️ Filter **${filter}** applied!`, ephemeral: true });
                }
            }

            // ── Button Controls ──
            switch (interaction.customId) {
                case 'music_previous':
                    if (queue.previousSongs.length === 0) {
                        return interaction.reply({ content: '❌ No previous song!', ephemeral: true });
                    }
                    await queue.previous();
                    await interaction.reply({ content: '⏮️ Playing previous song!', ephemeral: true });
                    break;

                case 'music_pause':
                    if (queue.paused) {
                        queue.resume();
                        await interaction.reply({ content: '▶️ Resumed!', ephemeral: true });
                    } else {
                        queue.pause();
                        await interaction.reply({ content: '⏸️ Paused!', ephemeral: true });
                    }
                    break;

                case 'music_shuffle':
                    await queue.shuffle();
                    await interaction.reply({ content: '🔀 Queue shuffled!', ephemeral: true });
                    break;

                case 'music_skip':
                    if (queue.songs.length <= 1 && queue.repeatMode === 0) {
                        await queue.stop();
                        await interaction.reply({ content: '⏹️ No more songs! Stopped.', ephemeral: true });
                    } else {
                        await queue.skip();
                        await interaction.reply({ content: '⏭️ Skipped!', ephemeral: true });
                    }
                    break;

                case 'music_loop':
                    const newMode = (queue.repeatMode + 1) % 3;
                    queue.setRepeatMode(newMode);
                    const modes = ['Off', '🔂 Song Loop', '🔁 Queue Loop'];
                    await interaction.reply({ content: `🔁 Loop: **${modes[newMode]}**`, ephemeral: true });
                    break;

                case 'music_voldown':
                    const downVol = Math.max(0, queue.volume - 10);
                    queue.setVolume(downVol);
                    await interaction.reply({ content: `🔉 Volume: **${downVol}%**`, ephemeral: true });
                    break;

                case 'music_volup':
                    const upVol = Math.min(100, queue.volume + 10);
                    queue.setVolume(upVol);
                    await interaction.reply({ content: `🔊 Volume: **${upVol}%**`, ephemeral: true });
                    break;

                case 'music_stop':
                    await queue.stop();
                    await interaction.reply({ content: '⏹️ Stopped and disconnected!', ephemeral: true });
                    break;
            }
        } catch (err) {
            console.error('  ❌ [MUSIC] Button error:', err.message);
            interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true }).catch(() => {});
        }
    });

    console.log('  ✅ [MUSIC] DisTube music player initialized!');
    return distube;
}

module.exports = { setupMusicPlayer, buildNowPlayingMessage, formatDuration, createProgressBar };
