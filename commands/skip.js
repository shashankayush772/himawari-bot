const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip the current track'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const skipped = queue.current.info.title;
        queue.player.stopTrack(); // triggers 'end' event → plays next

        const embed = new EmbedBuilder()
            .setColor(0xE67E22)
            .setDescription(`⏭️ Skipped **${skipped}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
