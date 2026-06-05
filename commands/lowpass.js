const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lowpass')
        .setDescription('🔇 Toggle low-pass filter (muffled/underwater sound)'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const isActive = queue.activeFilter === 'Low Pass';

        if (isActive) {
            await queue.player.setFilters({});
            queue.activeFilter = null;
        } else {
            await queue.player.setFilters({
                lowPass: { smoothing: 20.0 },
            });
            queue.activeFilter = 'Low Pass';
        }

        const embed = new EmbedBuilder()
            .setColor(isActive ? 0xED4245 : 0x607D8B)
            .setDescription(isActive ? '❌ Low Pass: **Disabled**' : '🔇 Low Pass: **Enabled** *(muffled sound)*')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
