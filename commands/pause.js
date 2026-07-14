const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸️ Pause the current song'),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        if (queue.paused) {
            return interaction.reply({ content: '⚠️ Already paused! Use `/resume` to continue.', ephemeral: true });
        }

        queue.pause();
        await interaction.reply('⏸️ Paused the music!');
    },
};
