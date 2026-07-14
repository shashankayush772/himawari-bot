const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { buildNowPlayingMessage } = require('../utils/music-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎶 Shows the currently playing song'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.currentTrack) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });
        }

        const msg = buildNowPlayingMessage(queue, queue.currentTrack);
        await interaction.reply(msg);
    },
};
