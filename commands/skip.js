const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip to the next song in queue'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        try {
            if (player.queue.length === 0 && player.loop === "NONE") {
                player.destroy();
                return interaction.reply('⏹️ No more songs in queue! Stopped.');
            }
            player.stop();
            await interaction.reply('⏭️ Skipped!');
        } catch (err) {
            await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
        }
    },
};
