const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('🗑️ Remove a song from the queue')
        .addIntegerOption(opt => opt.setName('position').setDescription('Position of the song in queue (use /queue to check)').setRequired(true).setMinValue(1)),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const pos = interaction.options.getInteger('position');

        if (pos > player.queue.length || pos < 1) {
            return interaction.reply({ content: `❌ Invalid position! Queue only has ${player.queue.length} songs.`, ephemeral: true });
        }

        const removed = player.queue.splice(pos - 1, 1)[0];
        await interaction.reply(`🗑️ Removed **${removed.info.title}** from the queue!`);
    },
};
