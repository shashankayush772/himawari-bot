const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('🗑️ Remove a song from the queue')
        .addIntegerOption(opt => opt.setName('position').setDescription('Position of the song in queue (use /queue to check)').setRequired(true).setMinValue(1)),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const pos = interaction.options.getInteger('position');

        if (pos >= queue.songs.length) {
            return interaction.reply({ content: `❌ Invalid position! Queue only has ${queue.songs.length - 1} songs (excluding current).`, ephemeral: true });
        }

        const removed = queue.songs.splice(pos, 1)[0];
        await interaction.reply(`🗑️ Removed **${removed.name}** from the queue!`);
    },
};
