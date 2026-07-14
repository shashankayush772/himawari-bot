const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('🎵 Toggle autoplay (auto-suggest songs after queue ends)'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        player.isAutoplay = !player.isAutoplay;
        await interaction.reply(player.isAutoplay ? '🎵 Autoplay **ON** — I\'ll keep suggesting songs!' : '🎵 Autoplay **OFF** — I\'ll stop after the queue ends.');
    },
};
