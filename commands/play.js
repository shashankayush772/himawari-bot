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
            const distube = interaction.client.distube;
            if (!distube) {
                return interaction.editReply('❌ Music system is not initialized!');
            }

            await interaction.editReply(`🔍 Searching for **${query}**...`);

            // Check if query is a direct YouTube URL
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                await interaction.editReply(`⚠️ **Note:** YouTube is aggressively blocking cloud bots right now. If it fails, try searching the song name instead!`);
            }

            let finalQuery = query;

            // If it's a plain text search, use DisTube's native SoundCloud plugin to bypass YouTube 429 bans
            if (!query.startsWith('http')) {
                finalQuery = `scsearch:${query}`;
            }

            await distube.play(voiceChannel, finalQuery, {
                textChannel: interaction.channel,
                member: interaction.member,
            });

            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 5000);

        } catch (err) {
            console.error('  ❌ [MUSIC] Play error:', err.message);
            if (err.message.includes('429')) {
                await interaction.editReply(`❌ **YouTube Blocked Us!** (Error 429). Please search by song name instead of a YouTube link! 🎵`);
            } else {
                await interaction.editReply(`❌ Could not play: ${err.message}`);
            }
        }
    },
};
