const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ytsr = require('ytsr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('youtube')
        .setDescription('🎬 Search for videos on YouTube')
        .addStringOption(opt =>
            opt.setName('query').setDescription('What to search for').setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        await interaction.deferReply();

        try {
            const res = await ytsr(query, { limit: 10 });
            const video = res.items.find(i => i.type === 'video');

            if (!video) {
                return interaction.editReply('❌ No video results found!');
            }

            const embed = new EmbedBuilder()
                .setTitle(video.title)
                .setURL(video.url)
                .setImage(video.bestThumbnail?.url || null)
                .setColor(0xFF0000)
                .setAuthor({ name: video.author?.name || 'Unknown' })
                .addFields(
                    { name: '👁️ Views', value: video.views?.toLocaleString() || 'N/A', inline: true },
                    { name: '⏱️ Duration', value: video.duration || 'N/A', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ Failed to search YouTube. Try again later!');
        }
    },
};