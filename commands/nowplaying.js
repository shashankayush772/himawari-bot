const { SlashCommandBuilder } = require('discord.js');
const { buildNowPlayingMessage } = require('../utils/music-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎵 Show the current playing song with controls'),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const song = queue.songs[0];
        const msg = buildNowPlayingMessage(queue, song);
        await interaction.reply(msg);
    },
};
