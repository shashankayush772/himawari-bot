const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('🎵 Toggle autoplay (auto-suggest songs after queue ends)'),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const newState = queue.toggleAutoplay();
        await interaction.reply(newState ? '🎵 Autoplay **ON** — I\'ll keep suggesting songs!' : '🎵 Autoplay **OFF** — I\'ll stop after the queue ends.');
    },
};
