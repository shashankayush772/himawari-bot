const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('🔀 Shuffle the tracks in the queue'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || queue.tracks.length < 2) {
            return interaction.reply({ content: '❌ Not enough tracks in the queue to shuffle.', ephemeral: true });
        }

        // Fisher-Yates shuffle
        for (let i = queue.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
        }

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(`🔀 Shuffled **${queue.tracks.length}** tracks in the queue!`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
