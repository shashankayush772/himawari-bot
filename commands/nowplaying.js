const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration, progressBar } = require('../utils/queue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎶 Show info about the currently playing track'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });

        const t = queue.current.info;
        const position = queue.player.position || 0;
        const bar = progressBar(position, t.length);
        const loopIcon = { off: '▶️', track: '🔂', queue: '🔁' };

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: '🎶 Now Playing' })
            .setTitle(t.title)
            .setURL(t.uri)
            .setDescription(`\`${formatDuration(position)} ${bar} ${formatDuration(t.length)}\``)
            .addFields(
                { name: '👤 Artist', value: t.author || 'Unknown', inline: true },
                { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
                { name: `${loopIcon[queue.loop]} Loop`, value: queue.loop, inline: true },
                { name: '📋 In Queue', value: `${queue.tracks.length} track(s)`, inline: true }
            )
            .setThumbnail(t.artworkUrl || null)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
