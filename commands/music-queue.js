const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../utils/queue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Show the current music queue'),

    async execute(interaction) {
        const queue = interaction.client.player.queues.get(interaction.guildId);
        if (!queue || !queue.currentTrack) return interaction.reply({ content: '❌ The queue is empty.', ephemeral: true });

        const current = `🎵 **Now:** [${queue.currentTrack.title}](${queue.currentTrack.url}) \`${formatDuration(queue.currentTrack.durationMS)}\``;

        const tracksArray = queue.tracks.toArray();
        const upcoming = tracksArray.slice(0, 10).map((t, i) =>
            `**${i + 1}.** [${t.title}](${t.url}) \`${formatDuration(t.durationMS)}\``
        ).join('\n');

        const totalDuration = tracksArray.reduce((acc, t) => acc + (t.durationMS || 0), 0) + (queue.currentTrack.durationMS || 0);

        const loopLabel = { 0: 'Off', 1: 'Track', 2: 'Queue' };

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📋 Music Queue')
            .setDescription(`${current}\n\n${upcoming || '*No upcoming tracks*'}`)
            .addFields(
                { name: '📊 Total Tracks', value: `${tracksArray.length + 1}`, inline: true },
                { name: '⏱️ Total Duration', value: formatDuration(totalDuration), inline: true },
                { name: '🔁 Loop', value: loopLabel[queue.repeatMode] || 'Off', inline: true }
            )
            .setTimestamp();

        if (tracksArray.length > 10) {
            embed.setFooter({ text: `...and ${tracksArray.length - 10} more tracks` });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
