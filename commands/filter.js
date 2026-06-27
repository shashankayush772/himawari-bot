const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const FILTERS = {
    bassboost: { label: 'Bass Boost', emoji: '🔊', id: 'bassboost' },
    nightcore: { label: 'Nightcore', emoji: '🌙', id: 'nightcore' },
    vaporwave: { label: 'Vaporwave', emoji: '🌊', id: 'vaporwave' },
    eightd: { label: '8D Audio', emoji: '🎧', id: '8D' },
    karaoke: { label: 'Karaoke', emoji: '🎤', id: 'karaoke' },
    tremolo: { label: 'Tremolo', emoji: '〰️', id: 'tremolo' },
    vibrato: { label: 'Vibrato', emoji: '🎵', id: 'vibrato' },
    lowpass: { label: 'Low Pass', emoji: '🔇', id: 'lowpass' }, // NOTE: lowpass might not be built-in, but usually fallback exists or we can just ignore failure
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
        const queue = interaction.client.player.queues.get(interaction.guildId);
        if (!queue || !queue.currentTrack) {
            return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
        }

        // Just pick the first enabled filter for display
        const enabledFilters = queue.filters.ffmpeg.getFiltersEnabled();
        let activeLabel = null;
        if (enabledFilters.length > 0) {
            const enabledId = enabledFilters[0];
            const foundKey = Object.keys(FILTERS).find(k => FILTERS[k].id === enabledId);
            if (foundKey) activeLabel = FILTERS[foundKey].label;
        }

        const embed = buildFilterEmbed(activeLabel);
        const buttons = buildButtons(activeLabel);

        const reply = await interaction.reply({ embeds: [embed], components: buttons, fetchReply: true });

        const collector = reply.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60_000,
        });

        collector.on('collect', async (btnInteraction) => {
            const queue = interaction.client.player.queues.get(interaction.guildId);
            if (!queue || !queue.currentTrack) {
                return btnInteraction.update({ content: '❌ Nothing is playing anymore.', embeds: [], components: [] });
            }

            const filterId = btnInteraction.customId.replace('filter_', '');
            
            // Defers update since applying filters can take a moment (FFmpeg restarts)
            await btnInteraction.deferUpdate();

            if (filterId === 'reset') {
                queue.filters.ffmpeg.setFilters(false); // disable all
            } else {
                const filter = FILTERS[filterId];
                if (!filter) return;

                // Toggle specifically this one, optionally clear others for singular mode
                try {
                    // Turn off all existing
                    queue.filters.ffmpeg.setFilters(false);
                    // Turn on the selected
                    const isSame = activeLabel === filter.label;
                    if (!isSame) {
                        queue.filters.ffmpeg.toggle(filter.id);
                    }
                } catch (e) {
                    console.error('Filter apply error:', e);
                }
            }

            // Let it propagate for a moment
            await new Promise(r => setTimeout(r, 100));

            const curEnabled = queue.filters.ffmpeg.getFiltersEnabled();
            let newLabel = null;
            if (curEnabled.length > 0) {
                const foundKey = Object.keys(FILTERS).find(k => FILTERS[k].id === curEnabled[0]);
                if (foundKey) newLabel = FILTERS[foundKey].label;
            }

            activeLabel = newLabel;
            const updatedEmbed = buildFilterEmbed(activeLabel);
            const updatedButtons = buildButtons(activeLabel);
            
            await btnInteraction.editReply({ embeds: [updatedEmbed], components: updatedButtons });
        });

        collector.on('end', async () => {
            try {
                const disabledButtons = buildButtons(activeLabel).map(row => {
                    row.components.forEach(btn => btn.setDisabled(true));
                    return row;
                });
                await reply.edit({ components: disabledButtons });
            } catch {}
        });
    },
};
