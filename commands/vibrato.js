const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vibrato')
        .setDescription('🎵 Toggle vibrato effect (pitch wobble)'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const isActive = queue.activeFilter === 'Vibrato';

        if (isActive) {
            await queue.player.setFilters({});
            queue.activeFilter = null;
        } else {
            await queue.player.setFilters({
                vibrato: { frequency: 4.0, depth: 0.75 },
            });
            queue.activeFilter = 'Vibrato';
        }

        const embed = new EmbedBuilder()
            .setColor(isActive ? 0xED4245 : 0x1ABC9C)
            .setDescription(isActive ? '❌ Vibrato: **Disabled**' : '🎵 Vibrato: **Enabled**')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
