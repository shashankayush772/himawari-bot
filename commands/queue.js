const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { formatDuration } = require('../utils/music-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Show the current music queue'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const tracks = [player.currentTrack, ...player.queue];
        const current = tracks[0];

        // Build pages (10 songs per page)
        const pages = [];
        const songsPerPage = 10;

        for (let i = 0; i < tracks.length; i += songsPerPage) {
            const chunk = tracks.slice(i, i + songsPerPage);
            const lines = chunk.map((song, index) => {
                const pos = i + index;
                const prefix = pos === 0 ? '▶️' : `**${pos}.**`;
                const duration = Math.round(song.info.length / 1000);
                return `${prefix} [${song.info.title}](${song.info.uri}) - \`${formatDuration(duration)}\``;
            });

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🎶 Server Music Queue')
                .setDescription(`**Currently Playing:**\n[${current.info.title}](${current.info.uri})\n\n**Up Next:**\n${lines.slice(1).join('\n') || 'No more songs in queue.'}`)
                .setFooter({ text: `Page ${Math.floor(i / songsPerPage) + 1} of ${Math.ceil(tracks.length / songsPerPage)} • ${tracks.length - 1} songs in queue` });
            
            pages.push(embed);
        }

        if (pages.length === 1) {
            return interaction.reply({ embeds: [pages[0]] });
        }

        // Pagination buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev_page').setLabel('◀️').setStyle(ButtonStyle.Primary).setDisabled(true),
            new ButtonBuilder().setCustomId('next_page').setLabel('▶️').setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.reply({ embeds: [pages[0]], components: [row], fetchReply: true });

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        let currentPage = 0;

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ You cannot use these buttons.', ephemeral: true });
            }

            if (i.customId === 'prev_page') currentPage--;
            else if (i.customId === 'next_page') currentPage++;

            row.components[0].setDisabled(currentPage === 0);
            row.components[1].setDisabled(currentPage === pages.length - 1);

            await i.update({ embeds: [pages[currentPage]], components: [row] });
        });

        collector.on('end', () => {
            row.components.forEach(c => c.setDisabled(true));
            message.edit({ components: [row] }).catch(() => {});
        });
    },
};
