const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('musicstop')
        .setDescription('⏹️ Stop the music and disconnect from voice channel'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        try {
            player.destroy();
            await interaction.reply('⏹️ Music stopped! Disconnected from voice channel. 👋');
        } catch (err) {
            await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
        }
    },
};
