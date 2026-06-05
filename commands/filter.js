const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const FILTERS = {
    bassboost: {
        label: 'Bass Boost', emoji: '🔊',
        settings: { equalizer: [0.35, 0.30, 0.25, 0.15, 0.10, 0.05, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((gain, band) => ({ band, gain })) },
    },
    nightcore: {
        label: 'Nightcore', emoji: '🌙',
        settings: { timescale: { speed: 1.25, pitch: 1.3, rate: 1.0 } },
    },
    vaporwave: {
        label: 'Vaporwave', emoji: '🌊',
        settings: { timescale: { speed: 0.85, pitch: 0.75, rate: 1.0 }, tremolo: { frequency: 14.0, depth: 0.25 } },
    },
    eightd: {
        label: '8D Audio', emoji: '🎧',
        settings: { rotation: { rotationHz: 0.2 } },
    },
    karaoke: {
        label: 'Karaoke', emoji: '🎤',
        settings: { karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 } },
    },
    tremolo: {
        label: 'Tremolo', emoji: '〰️',
        settings: { tremolo: { frequency: 4.0, depth: 0.75 } },
    },
    vibrato: {
        label: 'Vibrato', emoji: '🎵',
        settings: { vibrato: { frequency: 4.0, depth: 0.75 } },
    },
    lowpass: {
        label: 'Low Pass', emoji: '🔇',
        settings: { lowPass: { smoothing: 20.0 } },
    },
};

function buildFilterEmbed(activeFilter) {
    return new EmbedBuilder()
        .setColor(activeFilter ? 0x5865F2 : 0x2F3136)
        .setTitle('🎛️ Audio Filters')
        .setDescription(activeFilter
            ? `Current filter: **${activeFilter}**\nTap a button to switch or reset.`
            : 'No filter active.\nTap a button to apply one.'
        )
        .setTimestamp();
}

function buildButtons(activeFilter) {
    const row1 = new ActionRowBuilder().addComponents(
        ...['bassboost', 'nightcore', 'vaporwave', 'eightd'].map(id => {
            const f = FILTERS[id];
            const isActive = activeFilter === f.label;
            return new ButtonBuilder()
                .setCustomId(`filter_${id}`)
                .setLabel(f.label)
                .setEmoji(f.emoji)
                .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Secondary);
        })
    );
    const row2 = new ActionRowBuilder().addComponents(
        ...['karaoke', 'tremolo', 'vibrato', 'lowpass'].map(id => {
            const f = FILTERS[id];
            const isActive = activeFilter === f.label;
            return new ButtonBuilder()
                .setCustomId(`filter_${id}`)
                .setLabel(f.label)
                .setEmoji(f.emoji)
                .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Secondary);
        })
    );
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('filter_reset')
            .setLabel('Reset All')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Danger)
    );
    return [row1, row2, row3];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('🎛️ Apply audio filters to the music'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) {
            return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
        }

        const embed = buildFilterEmbed(queue.activeFilter || null);
        const buttons = buildButtons(queue.activeFilter || null);

        const reply = await interaction.reply({ embeds: [embed], components: buttons, fetchReply: true });

        const collector = reply.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60_000,
        });

        collector.on('collect', async (btnInteraction) => {
            const queue = interaction.client.queue.get(interaction.guildId);
            if (!queue || !queue.current) {
                return btnInteraction.update({ content: '❌ Nothing is playing anymore.', embeds: [], components: [] });
            }

            const filterId = btnInteraction.customId.replace('filter_', '');

            if (filterId === 'reset') {
                await queue.player.setFilters({});
                queue.activeFilter = null;
            } else {
                const filter = FILTERS[filterId];
                if (!filter) return;

                if (queue.activeFilter === filter.label) {
                    // Toggle off if same filter
                    await queue.player.setFilters({});
                    queue.activeFilter = null;
                } else {
                    // Apply new filter
                    await queue.player.setFilters(filter.settings);
                    queue.activeFilter = filter.label;
                }
            }

            const updatedEmbed = buildFilterEmbed(queue.activeFilter);
            const updatedButtons = buildButtons(queue.activeFilter);
            await btnInteraction.update({ embeds: [updatedEmbed], components: updatedButtons });
        });

        collector.on('end', async () => {
            try {
                const disabledButtons = buildButtons(queue?.activeFilter || null).map(row => {
                    row.components.forEach(btn => btn.setDisabled(true));
                    return row;
                });
                await reply.edit({ components: disabledButtons });
            } catch {}
        });
    },
};
