const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Resume the paused track'),

    async execute(interaction) {
        const queue = interaction.client.player.queues.get(interaction.guildId);
        if (!queue || !queue.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        queue.node.setPaused(false);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`▶️ Resumed **${queue.currentTrack.title}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
