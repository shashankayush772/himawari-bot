const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Shows the current music queue'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });
        }

        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray();

        let description = `**Now Playing:**\n[${currentTrack.title}](${currentTrack.url})\n\n**Up Next:**\n`;

        if (tracks.length === 0) {
            description += 'No more songs in the queue.';
        } else {
            const nextTracks = tracks.slice(0, 10);
            description += nextTracks.map((track, i) => `**${i + 1}.** [${track.title}](${track.url})`).join('\n');
            if (tracks.length > 10) {
                description += `\n\n*...and ${tracks.length - 10} more*`;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🎶 Queue for ${interaction.guild.name}`)
            .setDescription(description)
            .setFooter({ text: `Total songs: ${tracks.length + 1}` });

        await interaction.reply({ embeds: [embed] });
    },
};
