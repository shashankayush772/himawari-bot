const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('🔀 Shuffle the current queue'),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        if (queue.songs.length <= 2) {
            return interaction.reply({ content: '⚠️ Need at least 2 songs in queue to shuffle!', ephemeral: true });
        }

        await queue.shuffle();
        await interaction.reply('🔀 Queue shuffled!');
    },
};
