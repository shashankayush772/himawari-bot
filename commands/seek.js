const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('⏩ Jump to a specific timestamp in the current song')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('Time in seconds to jump to').setRequired(true).setMinValue(0)),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const seconds = interaction.options.getInteger('seconds');
        const songLength = Math.round(player.currentTrack.info.length / 1000);

        if (seconds >= songLength) {
            return interaction.reply({ content: `❌ Song is only ${songLength} seconds long!`, ephemeral: true });
        }

        player.seekTo(seconds * 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        await interaction.reply(`⏩ Jumped to **${mins}:${secs.toString().padStart(2, '0')}**`);
    },
};
