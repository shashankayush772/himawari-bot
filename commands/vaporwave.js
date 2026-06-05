const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vaporwave')
        .setDescription('🌊 Toggle vaporwave effect (slow down + lower pitch)'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const isActive = queue.activeFilter === 'Vaporwave';

        if (isActive) {
            await queue.player.setFilters({});
            queue.activeFilter = null;
        } else {
            await queue.player.setFilters({
                timescale: { speed: 0.85, pitch: 0.75, rate: 1.0 },
                tremolo: { frequency: 14.0, depth: 0.25 },
            });
            queue.activeFilter = 'Vaporwave';
        }

        const embed = new EmbedBuilder()
            .setColor(isActive ? 0xED4245 : 0xE91E63)
            .setDescription(isActive ? '❌ Vaporwave: **Disabled**' : '🌊 Vaporwave: **Enabled**')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
