const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer, QueryType } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play a song from SoundCloud, Spotify, or a URL')
        .addStringOption(opt => opt.setName('query').setDescription('Song name or URL').setRequired(true)),

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
            const player = useMainPlayer();
            if (!player) {
                return interaction.editReply('❌ Music system is not initialized!');
            }

            // Check if any extractors are loaded
            if (player.extractors.size === 0) {
                return interaction.editReply('❌ No music extractors are loaded! The bot needs to be restarted.');
            }

            await interaction.editReply(`🔍 Searching for **${query}**...`);
            
            // Determine search type: auto-detect URLs, default to SoundCloud search for text queries
            const isURL = query.startsWith('http://') || query.startsWith('https://');
            
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: isURL ? QueryType.AUTO : QueryType.SOUNDCLOUD_SEARCH
            });

            if (!searchResult || !searchResult.tracks.length) {
                return interaction.editReply('❌ No results found! Try a different search term or a direct SoundCloud/Spotify URL.');
            }

            console.log(`  🎵 [PLAY] Found ${searchResult.tracks.length} tracks, source: ${searchResult.tracks[0]?.extractor?.identifier || 'unknown'}`);

            const { track } = await player.play(voiceChannel, searchResult, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.client,
                        guild: interaction.guild
                    },
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 30000,
                    leaveOnEnd: false,
                    selfDeaf: true
                }
            });

            await interaction.editReply(`📋 Added **${track.title}** to queue!`);

            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 5000);

        } catch (err) {
            console.error('  ❌ [MUSIC] Play error:', err.message, err.stack);
            await interaction.editReply(`❌ Could not play: ${err.message}`);
        }
    },
};
