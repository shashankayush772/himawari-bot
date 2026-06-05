const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8d')
        .setDescription('🎧 Toggle 8D audio effect (rotating stereo)'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const isActive = queue.activeFilter === '8D Audio';

        if (isActive) {
            await queue.player.setFilters({});
            queue.activeFilter = null;
        } else {
            await queue.player.setFilters({
                rotation: { rotationHz: 0.2 },
            });
            queue.activeFilter = '8D Audio';
        }

        const embed = new EmbedBuilder()
            .setColor(isActive ? 0xED4245 : 0x3498DB)
            .setDescription(isActive ? '❌ 8D Audio: **Disabled**' : '🎧 8D Audio: **Enabled** *(use headphones!)*')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
