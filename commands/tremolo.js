const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tremolo')
        .setDescription('〰️ Toggle tremolo effect (volume wobble)'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const isActive = queue.activeFilter === 'Tremolo';

        if (isActive) {
            await queue.player.setFilters({});
            queue.activeFilter = null;
        } else {
            await queue.player.setFilters({
                tremolo: { frequency: 4.0, depth: 0.75 },
            });
            queue.activeFilter = 'Tremolo';
        }

        const embed = new EmbedBuilder()
            .setColor(isActive ? 0xED4245 : 0xE67E22)
            .setDescription(isActive ? '❌ Tremolo: **Disabled**' : '〰️ Tremolo: **Enabled**')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
