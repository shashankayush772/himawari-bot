const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function formatDuration(ms) {
    if (!ms || ms === 0) return '🔴 LIVE';
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;
}

function progressBar(current, total, length = 20) {
    if (!total) return '▬'.repeat(length);
    const filled = Math.min(Math.round((current / total) * length), length);
    return '▬'.repeat(filled) + '🔘' + '▬'.repeat(Math.max(length - filled - 1, 0));
}

// Works with discord-player's GuildQueue
function buildNowPlayingButtons(queue) {
    const isPaused = queue.node.isPaused();
    // discord-player repeatMode: 0=off, 1=track, 2=queue, 3=autoplay
    const loopEmoji = { 0: '🚫', 1: '🔂', 2: '🔁' };
    const loopLabel = { 0: 'Loop', 1: 'Track', 2: 'Queue' };

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('np_pause')
            .setEmoji(isPaused ? '▶️' : '⏸️')
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('np_skip')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('np_stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('np_loop')
            .setEmoji(loopEmoji[queue.repeatMode] || '🚫')
            .setLabel(loopLabel[queue.repeatMode] || 'Loop')
            .setStyle(queue.repeatMode === 0 ? ButtonStyle.Secondary : ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('np_shuffle')
            .setEmoji('🔀')
            .setStyle(ButtonStyle.Secondary)
    );

    return [row1];
}

module.exports = { formatDuration, progressBar, buildNowPlayingButtons };
