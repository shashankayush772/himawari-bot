const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play a song from YouTube')
        .addStringOption(opt => opt.setName('query').setDescription('Song name or YouTube URL').setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const member = interaction.member;
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: '❌ You need to be in a voice channel first!', ephemeral: true });
        }

        const botMember = interaction.guild.members.me;
        if (!voiceChannel.permissionsFor(botMember).has(['Connect', 'Speak'])) {
            return interaction.reply({ content: '❌ I don\'t have permission to join/speak in that voice channel!', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const poru = interaction.client.poru;
            if (!poru) {
                return interaction.editReply('❌ Music system is not initialized!');
            }

            // Create or get Lavalink player
            let player = poru.players.get(interaction.guild.id);
            if (!player) {
                player = poru.createConnection({
                    guildId: interaction.guild.id,
                    voiceChannel: voiceChannel.id,
                    textChannel: interaction.channel.id,
                    deaf: true
                });
            }

            // Search query (Default to SoundCloud to bypass YouTube blocks unless it's a direct URL)
            let searchSource = query.startsWith('http') ? undefined : 'scsearch';
            
            await interaction.editReply(`🔍 Searching for **${query}**...`);
            
            const resolve = await poru.resolve(query, searchSource);

            if (resolve.loadType === 'error' || resolve.loadType === 'empty') {
                return interaction.editReply('❌ No results found or an error occurred!');
            }

            if (resolve.loadType === 'playlist') {
                for (const track of resolve.tracks) {
                    track.info.requester = interaction.user;
                    player.queue.add(track);
                }
                await interaction.editReply(`📋 Added playlist **${resolve.playlistInfo.name}** (${resolve.tracks.length} tracks)!`);
            } else {
                const track = resolve.tracks[0];
                track.info.requester = interaction.user;
                player.queue.add(track);
                await interaction.editReply(`📋 Added **${track.info.title}** to queue!`);
            }

            if (!player.isPlaying && !player.isPaused) player.play();

            // Clean up the search reply
            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 5000);

        } catch (err) {
            console.error('  ❌ [MUSIC] Play error:', err.message);
            await interaction.editReply(`❌ Could not play: ${err.message}`);
        }
    },
};
