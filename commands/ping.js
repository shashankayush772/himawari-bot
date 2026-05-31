const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Check bot latency and API response time'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🏓 PONG!')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '⏱️ Latency', value: `\`${latency}ms\``, inline: true },
                { name: '📡 API Latency', value: `\`${Math.round(interaction.client.ws.ping)}ms\``, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    },
};