const { SlashCommandBuilder } = require('discord.js');
const { buildNowPlayingMessage } = require('../utils/music-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎵 Show the current playing song with controls'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const track = player.currentTrack;
        const song = {
            name: track.info.title,
            url: track.info.uri,
            thumbnail: track.info.image || `https://img.youtube.com/vi/${track.info.identifier}/hqdefault.jpg`,
            duration: Math.round(track.info.length / 1000),
            user: track.info.requester || null
        };
        const queue = {
            currentTime: 0,
            volume: player.volume,
            repeatMode: player.loop === 'NONE' ? 0 : player.loop === 'TRACK' ? 1 : 2,
            songs: [song, ...player.queue],
            paused: player.isPaused
        };
        const msg = buildNowPlayingMessage(queue, song);
        await interaction.reply(msg);
    },
};
