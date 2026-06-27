const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip the current track'),

    async execute(interaction) {
        const queue = interaction.client.player.queues.get(interaction.guildId);
        if (!queue || !queue.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const skipped = queue.currentTrack.title;
        queue.node.skip();

        const embed = new EmbedBuilder()
            .setColor(0xE67E22)
            .setDescription(`⏭️ Skipped **${skipped}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
