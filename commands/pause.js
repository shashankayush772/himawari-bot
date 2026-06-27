const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸️ Pause the current track'),

    async execute(interaction) {
        const queue = interaction.client.player.queues.get(interaction.guildId);
        if (!queue || !queue.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        queue.node.setPaused(true);

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setDescription(`⏸️ Paused **${queue.currentTrack.title}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
