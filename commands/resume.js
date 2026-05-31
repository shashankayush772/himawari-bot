const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Resume the paused track'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        queue.player.setPaused(false);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`▶️ Resumed **${queue.current.info.title}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
