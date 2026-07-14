const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play a song from YouTube or SoundCloud')
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

            await interaction.editReply(`🔍 Searching for **${query}**...`);
            
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: query.startsWith('http') ? 'auto' : 'soundcloudSearch' // Bypasses YT blocks
            });

            if (!searchResult || !searchResult.tracks.length) {
                return interaction.editReply('❌ No results found!');
            }

            const { track } = await player.play(voiceChannel, searchResult, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.client,
                        guild: interaction.guild
                    },
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 30000,
                    leaveOnEnd: false
                }
            });

            await interaction.editReply(`📋 Added **${track.title}** to queue!`);

            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 5000);

        } catch (err) {
            console.error('  ❌ [MUSIC] Play error:', err.message);
            await interaction.editReply(`❌ Could not play: ${err.message}`);
        }
    },
};
