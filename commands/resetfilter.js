const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetfilter')
        .setDescription('🔄 Reset all audio filters back to normal'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const hadFilter = queue.activeFilter;
        await queue.player.setFilters({});
        queue.activeFilter = null;

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(hadFilter
                ? `🔄 Filter **${hadFilter}** removed. Audio is back to normal.`
                : '✅ No filters were active. Audio is already normal.'
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
