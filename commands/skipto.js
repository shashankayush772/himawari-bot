const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('⏭️ Skip to a specific song in the queue')
        .addIntegerOption(opt => opt.setName('position').setDescription('Position of the song to skip to').setRequired(true).setMinValue(1)),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const pos = interaction.options.getInteger('position');

        if (pos > player.queue.length || pos < 1) {
            return interaction.reply({ content: `❌ Invalid position! Queue only has ${player.queue.length} songs.`, ephemeral: true });
        }

        try {
            player.queue.splice(0, pos - 1);
            player.stop();
            await interaction.reply(`⏭️ Skipped to position **#${pos}**!`);
        } catch (err) {
            await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
        }
    },
};
