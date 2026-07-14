const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Resume the paused song'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        if (!player.isPaused) {
            return interaction.reply({ content: '⚠️ Music is already playing!', ephemeral: true });
        }

        player.pause(false);
        await interaction.reply('▶️ Resumed the music!');
    },
};
