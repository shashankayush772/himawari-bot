const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('🔁 Set loop mode for playback')
        .addIntegerOption(opt =>
            opt.setName('mode').setDescription('Loop mode').setRequired(true)
                .addChoices(
                    { name: '🚫 Off', value: 0 },
                    { name: '🔂 Track (repeat current)', value: 1 },
                    { name: '🔁 Queue (repeat all)', value: 2 }
                )
        ),

    async execute(interaction) {
        const queue = interaction.client.player.queues.get(interaction.guildId);
        if (!queue || !queue.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const mode = interaction.options.getInteger('mode');
        queue.setRepeatMode(mode);

        const icons = { 0: '🚫', 1: '🔂', 2: '🔁' };
        const labels = { 0: 'Off', 1: 'Looping Current Track', 2: 'Looping Entire Queue' };

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setDescription(`${icons[mode]} Loop mode: **${labels[mode]}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
