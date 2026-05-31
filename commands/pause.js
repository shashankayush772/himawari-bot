const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸️ Pause the current track'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        queue.player.setPaused(true);

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setDescription(`⏸️ Paused **${queue.current.info.title}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
