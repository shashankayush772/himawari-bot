const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nightcore')
        .setDescription('🌙 Toggle nightcore effect (speed up + higher pitch)'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const isActive = queue.activeFilter === 'Nightcore';

        if (isActive) {
            await queue.player.setFilters({});
            queue.activeFilter = null;
        } else {
            await queue.player.setFilters({
                timescale: { speed: 1.25, pitch: 1.3, rate: 1.0 },
            });
            queue.activeFilter = 'Nightcore';
        }

        const embed = new EmbedBuilder()
            .setColor(isActive ? 0xED4245 : 0x9B59B6)
            .setDescription(isActive ? '❌ Nightcore: **Disabled**' : '🌙 Nightcore: **Enabled**')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
