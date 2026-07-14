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

            await distube.play(voiceChannel, query, {
                textChannel: interaction.channel,
                member: interaction.member,
            });

            await interaction.editReply(`🔍 Searching for **${query}**...`);

            // Auto-delete the search message after 5 seconds
            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 5000);

        } catch (err) {
            console.error('  ❌ [MUSIC] Play error:', err.message);
            await interaction.editReply(`❌ Could not play: ${err.message}`);
        }
    },
};
