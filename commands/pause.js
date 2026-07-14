const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸️ Pause the current song'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        if (player.isPaused) {
            return interaction.reply({ content: '⚠️ Already paused! Use `/resume` to continue.', ephemeral: true });
        }

        player.pause(true);
        await interaction.reply('⏸️ Paused the music!');
    },
};
