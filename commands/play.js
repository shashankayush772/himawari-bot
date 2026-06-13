const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
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

        // Get a connected node (state 2 = CONNECTED)
        const connectedNodes = [...interaction.client.shoukaku.nodes.values()].filter(n => n.state === 2);
        const node = connectedNodes[0] || interaction.client.shoukaku.getIdealNode?.();
        if (!node) return interaction.reply({ content: '❌ All music servers are currently offline. They auto-reconnect every 2 minutes — please try again shortly!', ephemeral: true });

        try {
            await interaction.deferReply();
        } catch {
            // If deferReply fails (network timeout), the interaction is dead — bail out
            return;
        }
        const query = interaction.options.getString('query');

        let result;
        try {
            if (/^https?:\/\//.test(query)) {
                // Direct URL (YouTube, SoundCloud, etc.)
                result = await node.rest.resolve(query);
            } else {
                // Try YouTube Music search first (best quality)
                result = await node.rest.resolve(`ytmsearch:${query}`);
                // Fallback to regular YouTube search
                if (!result || result.loadType === 'empty') {
                    result = await node.rest.resolve(`ytsearch:${query}`);
                }
                // Fallback to SoundCloud
                if (!result || result.loadType === 'empty') {
                    result = await node.rest.resolve(`scsearch:${query}`);
                }
            }
        } catch (err) {
            console.error(`  ❌ [DEBUG] resolve() threw:`, err.message);
            return interaction.editReply('❌ Search failed. Lavalink error.');
        }
        if (!result || result.loadType === 'empty' || result.loadType === 'error') {
            return interaction.editReply('❌ No results found for that query.');
        }

        let tracks = [];
        let playlistName = null;

        if (result.loadType === 'playlist') {
            tracks = result.data.tracks;
            playlistName = result.data.info.name;
        } else if (result.loadType === 'search') {
            tracks = [result.data[0]];
        } else if (result.loadType === 'track') {
            tracks = [result.data];
        }

        if (!tracks.length) return interaction.editReply('❌ No results found.');

        let queue = interaction.client.queue.get(interaction.guildId);

        if (!queue) {
            try {
                const player = await interaction.client.shoukaku.joinVoiceChannel({
                    guildId: interaction.guildId,
                    channelId: voice.id,
                    shardId: interaction.guild.shardId,
                    deaf: true,
                });
                player.setGlobalVolume(100);

                queue = interaction.client.queue.create(interaction.guildId, {
                    textChannelId: interaction.channelId,
                    voiceChannelId: voice.id,
                    player,
                });
            } catch (joinErr) {
                console.error('  ❌ [DEBUG] joinVoiceChannel failed:', joinErr.message);
                return interaction.editReply('❌ Lavalink is reconnecting. Please try again in a few seconds.');
            }
        }

        for (const t of tracks) queue.tracks.push(t);

        if (!queue.current) {
            queue.current = queue.tracks.shift();
            queue.player.playTrack({ track: { encoded: queue.current.encoded } });

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setAuthor({ name: '🎵 Now Playing' })
                .setTitle(queue.current.info.title)
                .setURL(queue.current.info.uri)
                .addFields(
                    { name: '👤 Artist', value: queue.current.info.author || 'Unknown', inline: true },
                    { name: '⏱️ Duration', value: formatDuration(queue.current.info.length), inline: true },
                    { name: '📋 Queue', value: `${queue.tracks.length} track(s)`, inline: true }
                )
                .setThumbnail(queue.current.info.artworkUrl || null)
                .setTimestamp();

            const buttons = buildNowPlayingButtons(queue);
            const reply = await interaction.editReply({ embeds: [embed], components: buttons });
            queue.nowPlayingMessage = reply;

            // Set Voice Channel Status via REST API
            try {
                await interaction.client.rest.put(
                    `/channels/${voice.id}/voice-status`,
                    { body: { status: `🎵 ${queue.current.info.title}`.substring(0, 175) } }
                );
            } catch (err) {
                console.error(`  ⚠️ [DEBUG] Failed to set VC status:`, err.message);
            }
        } else {
            const t = tracks[0];
            const embed = new EmbedBuilder()
                .setColor(0xFEE75C)
                .setAuthor({ name: '📋 Added to Queue' })
                .setTitle(playlistName || t.info.title)
                .setURL(!playlistName ? t.info.uri : null)
                .addFields(
                    { name: '⏱️ Duration', value: tracks.length > 1 ? `${tracks.length} tracks` : formatDuration(t.info.length), inline: true },
                    { name: '📊 Position', value: `#${queue.tracks.length}`, inline: true }
                )
                .setThumbnail(t.info.artworkUrl || null)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
