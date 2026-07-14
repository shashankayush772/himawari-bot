const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('🔁 Toggle loop mode (Off → Song → Queue)'),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const newMode = (queue.repeatMode + 1) % 3;
        queue.setRepeatMode(newMode);

        const modes = ['❌ Loop Off', '🔂 Looping Current Song', '🔁 Looping Entire Queue'];
        await interaction.reply(modes[newMode]);
    },
};
