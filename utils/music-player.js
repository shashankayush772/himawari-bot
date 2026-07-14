const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
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

const { Poru } = require('poru');

// ── Initialize Poru on the client ──
function setupMusicPlayer(client) {
    const nodes = [
        { name: 'Public Node 1', host: 'lava-v3.ajieblogs.eu.org', port: 443, password: 'https://dsc.gg/ajidevserver', secure: true },
        { name: 'Public Node 2', host: 'lavalink.oops.wtf', port: 443, password: 'www.freelavalink.rest', secure: true },
        { name: 'Public Node 3', host: 'lava.link', port: 80, password: 'anything', secure: false },
        { name: 'Public Node 4', host: 'lavalink.kohi.dev', port: 443, password: 'kohi', secure: true },
        { name: 'Public Node 5', host: 'node.lavalink.wtf', port: 443, password: 'www.freelavalink.rest', secure: true }
    ];

    const poru = new Poru(client, nodes, {
        reconnectTries: 10,
        reconnectTimeout: 10000,
        spotify: {
            playlistLimit: 2
        }
    });

    client.poru = poru;

    // ── Poru Events ──

    poru.on('nodeConnect', (node) => {
        console.log(`  ✅ [LAVALINK] Connected to Node: ${node.name}`);
    });

    poru.on('nodeError', (node, error) => {
        console.error(`  ❌ [LAVALINK] Node ${node.name} Error:`, error.message);
    });

    poru.on('trackStart', (player, track) => {
        // Need to simulate a song object for the buildNowPlayingMessage
        const song = {
            name: track.info.title,
            url: track.info.uri,
            thumbnail: track.info.image || `https://img.youtube.com/vi/${track.info.identifier}/hqdefault.jpg`,
            duration: Math.round(track.info.length / 1000), // milliseconds to seconds
            user: track.info.requester || null
        };
        
        // Map player to queue
        const queue = {
            currentTime: 0,
            volume: player.volume,
            repeatMode: player.loop === 'NONE' ? 0 : player.loop === 'TRACK' ? 1 : 2,
            songs: [song, ...player.queue],
            paused: player.isPaused
        };

        const msg = buildNowPlayingMessage(queue, song);
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) channel.send(msg).catch(() => {});

        // Set VC status
        setVoiceStatus(client, player.voiceChannel, `🎵 ${song.name.substring(0, 45) || 'Playing music'}`);
    });

    poru.on('queueEnd', (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setDescription('🏁 Queue finished! Add more songs or I\'ll leave in 30 seconds.');
            channel.send({ embeds: [embed] }).catch(() => {});
        }
        
        setVoiceStatus(client, player.voiceChannel, '');
        
        // Instead of leaving immediately, we could wait, but for now we just destroy
        setTimeout(() => {
            if (!player.isPlaying) player.destroy();
        }, 30000);
    });

    // ── Handle Button Interactions ──
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
        if (!interaction.customId.startsWith('music_')) return;

        const player = poru.players.get(interaction.guildId);

        if (!player) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true }).catch(() => {});
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== player.voiceChannel) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true }).catch(() => {});
        }

        try {
            // ── Filter Dropdown ──
            if (interaction.isStringSelectMenu() && interaction.customId === 'music_filter') {
                const filter = interaction.values[0];
                if (filter === 'clear') {
                    player.filters.clearFilters();
                    return interaction.reply({ content: '🎛️ All filters cleared!', ephemeral: true });
                }
                
                // Extremely simple filter mapping for Poru
                if (filter === 'bassboost') {
                    player.filters.setEqualizer([{ band: 0, gain: 0.6 }, { band: 1, gain: 0.67 }, { band: 2, gain: 0.67 }, { band: 3, gain: 0.4 }, { band: 4, gain: 0.15 }]);
                } else if (filter === 'nightcore') {
                    player.filters.setTimescale({ speed: 1.2, pitch: 1.2, rate: 1.0 });
                } else if (filter === 'vaporwave') {
                    player.filters.setTimescale({ speed: 0.8, pitch: 0.8, rate: 1.0 });
                } else if (filter === '3d') {
                    player.filters.setRotation({ rotationHz: 0.2 });
                } else if (filter === 'karaoke') {
                    player.filters.setKaraoke({ level: 1.0, monoLevel: 1.0, filterBand: 220, filterWidth: 100 });
                } else if (filter === 'earrape') {
                    player.setVolume(500);
                    player.filters.setEqualizer([...Array(15).keys()].map(i => ({ band: i, gain: 0.5 })));
                } else if (filter === 'tremolo') {
                    player.filters.setTremolo({ frequency: 2.0, depth: 0.5 });
                }
                
                return interaction.reply({ content: `🎛️ Filter **${filter}** applied!`, ephemeral: true });
            }

            // ── Button Controls ──
            switch (interaction.customId) {
                case 'music_previous':
                    if (player.previousTrack) {
                        player.queue.unshift(player.previousTrack);
                        player.stop();
                        await interaction.reply({ content: '⏮️ Playing previous song!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: '❌ No previous song!', ephemeral: true });
                    }
                    break;

                case 'music_pause':
                    player.pause(!player.isPaused);
                    await interaction.reply({ content: player.isPaused ? '⏸️ Paused!' : '▶️ Resumed!', ephemeral: true });
                    break;

                case 'music_shuffle':
                    player.queue.shuffle();
                    await interaction.reply({ content: '🔀 Queue shuffled!', ephemeral: true });
                    break;

                case 'music_skip':
                    player.stop();
                    await interaction.reply({ content: '⏭️ Skipped!', ephemeral: true });
                    break;

                case 'music_loop':
                    const loops = ['NONE', 'TRACK', 'QUEUE'];
                    const currentLoop = loops.indexOf(player.loop);
                    const nextLoop = loops[(currentLoop + 1) % 3];
                    player.setLoop(nextLoop);
                    const displayModes = ['Off', '🔂 Song Loop', '🔁 Queue Loop'];
                    await interaction.reply({ content: `🔁 Loop: **${displayModes[(currentLoop + 1) % 3]}**`, ephemeral: true });
                    break;

                case 'music_voldown':
                    const downVol = Math.max(0, player.volume - 10);
                    player.setVolume(downVol);
                    await interaction.reply({ content: `🔉 Volume: **${downVol}%**`, ephemeral: true });
                    break;

                case 'music_volup':
                    const upVol = Math.min(100, player.volume + 10);
                    player.setVolume(upVol);
                    await interaction.reply({ content: `🔊 Volume: **${upVol}%**`, ephemeral: true });
                    break;

                case 'music_stop':
                    player.destroy();
                    await interaction.reply({ content: '⏹️ Stopped and disconnected!', ephemeral: true });
                    break;
            }
        } catch (err) {
            console.error('  ❌ [MUSIC] Button error:', err.message);
            interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true }).catch(() => {});
        }
    });

    console.log('  ✅ [MUSIC] Poru Lavalink music player initialized!');
    return poru;
}

module.exports = { setupMusicPlayer, buildNowPlayingMessage, formatDuration, createProgressBar };
