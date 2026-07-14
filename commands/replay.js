const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('replay')
        .setDescription('🔄 Replay the current song from the beginning'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        player.seekTo(0);
        await interaction.reply('🔄 Replaying from the start!');
    },
};
