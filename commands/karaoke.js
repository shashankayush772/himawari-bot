const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('karaoke')
        .setDescription('🎤 Toggle karaoke mode (reduces vocals)'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const isActive = queue.activeFilter === 'Karaoke';

        if (isActive) {
            await queue.player.setFilters({});
            queue.activeFilter = null;
        } else {
            await queue.player.setFilters({
                karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 },
            });
            queue.activeFilter = 'Karaoke';
        }

        const embed = new EmbedBuilder()
            .setColor(isActive ? 0xED4245 : 0xF1C40F)
            .setDescription(isActive ? '❌ Karaoke: **Disabled**' : '🎤 Karaoke: **Enabled** *(vocals reduced)*')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
