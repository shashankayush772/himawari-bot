const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bassboost')
        .setDescription('🔊 Toggle bass boost on the current track')
        .addStringOption(opt =>
            opt.setName('level')
                .setDescription('Bass boost intensity')
                .setRequired(false)
                .addChoices(
                    { name: '🔈 Low', value: 'low' },
                    { name: '🔉 Medium', value: 'medium' },
                    { name: '🔊 High', value: 'high' },
                    { name: '❌ Off', value: 'off' }
                )
        ),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const level = interaction.options.getString('level') || 'medium';

        const gains = {
            off:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            low:    [0.15, 0.12, 0.10, 0.05, 0.02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            medium: [0.35, 0.30, 0.25, 0.15, 0.10, 0.05, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            high:   [0.50, 0.45, 0.40, 0.30, 0.20, 0.10, 0.05, 0, 0, 0, 0, 0, 0, 0, 0],
        };

        const equalizer = gains[level].map((gain, band) => ({ band, gain }));

        await queue.player.setFilters({ equalizer });
        queue.activeFilter = level === 'off' ? null : `Bass Boost (${level})`;

        const emoji = { off: '❌', low: '🔈', medium: '🔉', high: '🔊' };
        const embed = new EmbedBuilder()
            .setColor(level === 'off' ? 0xED4245 : 0x57F287)
            .setDescription(`${emoji[level]} Bass Boost: **${level === 'off' ? 'Disabled' : level.charAt(0).toUpperCase() + level.slice(1)}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
