const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../utils/queue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Show the current music queue'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ The queue is empty.', ephemeral: true });

        const current = `🎵 **Now:** [${queue.current.info.title}](${queue.current.info.uri}) \`${formatDuration(queue.current.info.length)}\``;

        const upcoming = queue.tracks.slice(0, 10).map((t, i) =>
            `**${i + 1}.** [${t.info.title}](${t.info.uri}) \`${formatDuration(t.info.length)}\``
        ).join('\n');

        const totalDuration = queue.tracks.reduce((acc, t) => acc + (t.info.length || 0), 0) + (queue.current.info.length || 0);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📋 Music Queue')
            .setDescription(`${current}\n\n${upcoming || '*No upcoming tracks*'}`)
            .addFields(
                { name: '📊 Total Tracks', value: `${queue.tracks.length + 1}`, inline: true },
                { name: '⏱️ Total Duration', value: formatDuration(totalDuration), inline: true },
                { name: '🔁 Loop', value: queue.loop, inline: true }
            )
            .setTimestamp();

        if (queue.tracks.length > 10) {
            embed.setFooter({ text: `...and ${queue.tracks.length - 10} more tracks` });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
