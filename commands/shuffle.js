const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('🔀 Shuffle the current queue'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        if (player.queue.length <= 1) {
            return interaction.reply({ content: '⚠️ Need at least 2 songs in queue to shuffle!', ephemeral: true });
        }

        player.queue.shuffle();
        await interaction.reply('🔀 Queue shuffled!');
    },
};
