const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration, progressBar } = require('../utils/queue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎶 Show info about the currently playing track'),

    async execute(interaction) {
        const queue = interaction.client.player.queues.get(interaction.guildId);
        if (!queue || !queue.currentTrack) return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });

        const t = queue.currentTrack;
        const position = queue.node.getTimestamp().current.value;
        const total = queue.node.getTimestamp().total.value;
        const bar = progressBar(position, total);
        const loopIcon = { 0: '▶️', 1: '🔂', 2: '🔁' };
        const loopLabel = { 0: 'Off', 1: 'Track', 2: 'Queue' };

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: '🎶 Now Playing' })
            .setTitle(t.title)
            .setURL(t.url)
            .setDescription(`\`${formatDuration(position)} ${bar} ${formatDuration(total)}\``)
            .addFields(
                { name: '👤 Artist', value: t.author || 'Unknown', inline: true },
                { name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true },
                { name: `${loopIcon[queue.repeatMode]} Loop`, value: loopLabel[queue.repeatMode] || 'Off', inline: true },
                { name: '📋 In Queue', value: `${queue.tracks.size} track(s)`, inline: true }
            )
            .setThumbnail(t.thumbnail || null)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
