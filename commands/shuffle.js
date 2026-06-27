const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('🔀 Shuffle the tracks in the queue'),

    async execute(interaction) {
        const queue = interaction.client.player.queues.get(interaction.guildId);
        if (!queue || queue.tracks.size < 2) {
            return interaction.reply({ content: '❌ Not enough tracks in the queue to shuffle.', ephemeral: true });
        }

        queue.tracks.shuffle();

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setDescription(`🔀 Shuffled **${queue.tracks.size}** tracks in the queue!`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
