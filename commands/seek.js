const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('⏩ Jump to a specific timestamp in the current song')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('Time in seconds to jump to').setRequired(true).setMinValue(0)),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const seconds = interaction.options.getInteger('seconds');
        const song = queue.songs[0];

        if (seconds >= song.duration) {
            return interaction.reply({ content: `❌ Song is only ${song.duration} seconds long!`, ephemeral: true });
        }

        await queue.seek(seconds);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        await interaction.reply(`⏩ Jumped to **${mins}:${secs.toString().padStart(2, '0')}**`);
    },
};
