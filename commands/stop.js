const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Stop playback and disconnect from voice'),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        queue.tracks = [];
        queue.current = null;
        queue.player.stopTrack();
        await interaction.client.shoukaku.leaveVoiceChannel(interaction.guildId);
        interaction.client.queue.delete(interaction.guildId);

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription('⏹️ **Stopped playback and disconnected.**')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
