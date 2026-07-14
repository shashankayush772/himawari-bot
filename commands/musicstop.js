const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('musicstop')
        .setDescription('⏹️ Stop the music and disconnect from voice channel'),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        try {
            await queue.stop();
            await interaction.reply('⏹️ Music stopped! Disconnected from voice channel. 👋');
        } catch (err) {
            await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
        }
    },
};
