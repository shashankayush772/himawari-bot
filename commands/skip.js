const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip to the next song in queue'),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        try {
            if (queue.songs.length <= 1 && queue.repeatMode === 0) {
                await queue.stop();
                return interaction.reply('⏹️ No more songs in queue! Stopped.');
            }
            await queue.skip();
            await interaction.reply('⏭️ Skipped!');
        } catch (err) {
            await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
        }
    },
};
