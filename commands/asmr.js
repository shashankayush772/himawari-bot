const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ASMR_URL = 'https://www.youtube.com/watch?v=HkbGpa1K5fc';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asmr')
        .setDescription('🎧 The next level of ASMR — wear headphones, close your eyes'),

    async execute(interaction) {
        const voice = interaction.member?.voice?.channel;
        if (!voice) return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });

        const node = interaction.client.shoukaku.getIdealNode?.()
            || [...interaction.client.shoukaku.nodes.values()][0];
        if (!node) return interaction.reply({ content: '❌ No Lavalink node available. Is Lavalink running?', ephemeral: true });

        try {
            await interaction.deferReply();
        } catch { return; }

        // Resolve the ASMR track
        let result;
        try {
            result = await node.rest.resolve(ASMR_URL);
        } catch (err) {
            console.error('  ❌ ASMR resolve error:', err.message);
            return interaction.editReply('❌ Failed to load the ASMR track.');
        }

        if (!result || result.loadType === 'empty' || result.loadType === 'error') {
            return interaction.editReply('❌ Could not load the ASMR track.');
        }

        const track = result.loadType === 'track' ? result.data
            : result.data?.tracks?.[0] || result.data?.[0];

        if (!track) return interaction.editReply('❌ No track found.');

        // Join VC & create queue if needed
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
                console.error('  ❌ ASMR join error:', joinErr.message);
                return interaction.editReply('❌ Lavalink is reconnecting. Please try again in a few seconds.');
            }
        }

        queue.tracks.push(track);

        if (!queue.current) {
            queue.current = queue.tracks.shift();
            queue.player.playTrack({ track: { encoded: queue.current.encoded } });
        }

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('🎧 The Next Level of ASMR')
            .setDescription('**Wear Headphones. Close Your Eyes. Relax.**\n\nPlaying immersive ASMR experience...')
            .setThumbnail(track.info?.artworkUrl || null)
            .addFields(
                { name: '🎵 Track', value: track.info?.title || 'ASMR', inline: true },
                { name: '👤 Artist', value: track.info?.author || 'Unknown', inline: true },
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Set VC status
        try {
            await interaction.client.rest.put(
                `/channels/${voice.id}/voice-status`,
                { body: { status: '🎧 ASMR — Close your eyes & relax'.substring(0, 175) } }
            );
        } catch {}
    },
};
