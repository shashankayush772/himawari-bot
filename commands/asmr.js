const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ASMR_URL = 'https://www.youtube.com/watch?v=HkbGpa1K5fc';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asmr')
        .setDescription('🎧 The next level of ASMR — wear headphones, close your eyes'),

    async execute(interaction) {
        const voice = interaction.member?.voice?.channel;
        if (!voice) return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });

        try {
            await interaction.deferReply();
        } catch { return; }

        const player = interaction.client.player;

        let result;
        try {
            result = await player.search(ASMR_URL, {
                requestedBy: interaction.user,
            });
        } catch (err) {
            console.error('  ❌ ASMR search error:', err.message);
            return interaction.editReply('❌ Failed to search for ASMR track.');
        }

        if (!result || !result.hasTracks()) {
            return interaction.editReply('❌ Could not find ASMR track.');
        }

        try {
            const existingQueue = player.queues.get(interaction.guildId);
            const is247 = existingQueue?.metadata?.is247 || false;

            const { track, queue } = await player.play(voice, result, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        is247: is247,
                    },
                    volume: 80,
                    leaveOnEmpty: !is247,
                    leaveOnEmptyCooldown: 300_000,
                    leaveOnEnd: !is247,
                    leaveOnEndCooldown: 300_000,
                    selfDeaf: true,
                },
            });

            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('🎧 The Next Level of ASMR')
                .setDescription('**Wear Headphones. Close Your Eyes. Relax.**\n\nPlaying immersive ASMR experience...')
                .setThumbnail(track.thumbnail || null)
                .addFields(
                    { name: '🎵 Track', value: track.title || 'ASMR', inline: true },
                    { name: '👤 Artist', value: track.author || 'Unknown', inline: true },
                )
                .setFooter({ text: `Requested by ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            try {
                await interaction.client.rest.put(
                    `/channels/${voice.id}/voice-status`,
                    { body: { status: '🎧 ASMR — Close your eyes & relax'.substring(0, 175) } }
                );
            } catch {}
        } catch (err) {
            console.error('  ❌ ASMR play error:', err.message);
            return interaction.editReply(`❌ Could not play ASMR track: ${err.message}`);
        }
    },
};
