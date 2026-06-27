const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QueryType } = require('discord-player');
const { formatDuration, buildNowPlayingButtons } = require('../utils/queue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play a song or add it to the queue')
        .addStringOption(opt => opt.setName('query').setDescription('Song name or URL').setRequired(true)),

    async execute(interaction) {
        const voice = interaction.member?.voice?.channel;
        if (!voice) return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });

        const permissions = voice.permissionsFor(interaction.client.user);
        if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
            return interaction.reply({ content: '❌ I do not have permission to **Connect** or **Speak** in your voice channel! Please check the channel permissions.', ephemeral: true });
        }

        try {
            await interaction.deferReply();
        } catch { return; }

        const query = interaction.options.getString('query');
        const player = interaction.client.player;

        // Search for the track
        let result;
        try {
            result = await player.search(query, {
                requestedBy: interaction.user,
            });
        } catch (err) {
            console.error('  ❌ [PLAY] Search error:', err.message);
            return interaction.editReply('❌ Failed to search for that song. Please try again.');
        }

        if (!result || !result.hasTracks()) {
            return interaction.editReply('❌ No results found for that query.');
        }

        try {
            // Get existing queue metadata (preserve 24/7 mode)
            const existingQueue = player.queues.get(interaction.guildId);
            const is247 = existingQueue?.metadata?.is247 || false;

            const { track, queue } = await player.play(voice, result, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        is247: is247,
                    },
                    volume: 80,
                    leaveOnEmpty: !is247,
                    leaveOnEmptyCooldown: 300_000,
                    leaveOnEnd: !is247,
                    leaveOnEndCooldown: 300_000,
                    selfDeaf: true,
                },
            });

            if (result.playlist) {
                const embed = new EmbedBuilder()
                    .setColor(0xFEE75C)
                    .setAuthor({ name: '📋 Playlist Added to Queue' })
                    .setTitle(result.playlist.title)
                    .setURL(result.playlist.url || null)
                    .addFields(
                        { name: '🎵 Tracks', value: `${result.tracks.length} tracks`, inline: true },
                        { name: '📊 Queue Size', value: `${queue.tracks.size} total`, inline: true }
                    )
                    .setThumbnail(result.playlist.thumbnail?.url || null)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else if (queue.currentTrack === track) {
                // This track is now playing
                const embed = new EmbedBuilder()
                    .setColor(0x57F287)
                    .setAuthor({ name: '🎵 Now Playing' })
                    .setTitle(track.title)
                    .setURL(track.url)
                    .addFields(
                        { name: '👤 Artist', value: track.author || 'Unknown', inline: true },
                        { name: '⏱️ Duration', value: track.duration || formatDuration(track.durationMS), inline: true },
                        { name: '📋 Queue', value: `${queue.tracks.size} track(s)`, inline: true }
                    )
                    .setThumbnail(track.thumbnail || null)
                    .setTimestamp();

                const buttons = buildNowPlayingButtons(queue);
                await interaction.editReply({ embeds: [embed], components: buttons });
            } else {
                // Added to queue
                const embed = new EmbedBuilder()
                    .setColor(0xFEE75C)
                    .setAuthor({ name: '📋 Added to Queue' })
                    .setTitle(track.title)
                    .setURL(track.url)
                    .addFields(
                        { name: '⏱️ Duration', value: track.duration || formatDuration(track.durationMS), inline: true },
                        { name: '📊 Position', value: `#${queue.tracks.size}`, inline: true }
                    )
                    .setThumbnail(track.thumbnail || null)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        } catch (err) {
            console.error('  ❌ [PLAY] Play error:', err.message, err.stack);
            return interaction.editReply(`❌ Could not play that track: ${err.message}`);
        }
    },
};
