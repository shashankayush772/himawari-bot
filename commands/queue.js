const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { formatDuration } = require('../utils/music-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Show the current music queue'),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const songs = queue.songs;
        const current = songs[0];

        // Build pages (10 songs per page)
        const pages = [];
        const songsPerPage = 10;

        for (let i = 0; i < songs.length; i += songsPerPage) {
            const chunk = songs.slice(i, i + songsPerPage);
            const lines = chunk.map((song, index) => {
                const pos = i + index;
                const prefix = pos === 0 ? '▶️' : `**${pos}.**`;
                const duration = formatDuration(song.duration);
                const name = song.name.length > 50 ? song.name.substring(0, 47) + '...' : song.name;
                return `${prefix} [${name}](${song.url}) — \`${duration}\``;
            });
            pages.push(lines.join('\n'));
        }

        let page = 0;

        const makeEmbed = () => new EmbedBuilder()
            .setColor(0xFF0000)
            .setAuthor({ name: '📋 Music Queue' })
            .setTitle(`Now Playing: ${current.name}`)
            .setDescription(pages[page])
            .setFooter({ text: `Page ${page + 1}/${pages.length} • ${songs.length} songs • Total: ${formatDuration(queue.duration)}` })
            .setTimestamp();

        const makeRow = () => {
            if (pages.length <= 1) return null;
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('q_prev').setLabel('◀').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('q_next').setLabel('▶').setStyle(ButtonStyle.Primary).setDisabled(page >= pages.length - 1),
            );
        };

        const components = makeRow() ? [makeRow()] : [];
        const response = await interaction.reply({ embeds: [makeEmbed()], components, fetchReply: true });

        if (pages.length <= 1) return;

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Not your buttons!', ephemeral: true });
            if (i.customId === 'q_prev') page--;
            if (i.customId === 'q_next') page++;
            await i.update({ embeds: [makeEmbed()], components: [makeRow()] });
        });

        collector.on('end', () => {
            response.edit({ components: [] }).catch(() => {});
        });
    },
};
