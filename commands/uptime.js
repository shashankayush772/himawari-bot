const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('⏱️ Check how long the bot has been running'),

    async execute(interaction) {
        const totalSeconds = Math.floor(interaction.client.uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor(totalSeconds / 3600) % 24;
        const minutes = Math.floor(totalSeconds / 60) % 60;
        const seconds = totalSeconds % 60;

        const embed = new EmbedBuilder()
            .setTitle('⏱️ UPTIME')
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `\n🗓️ **Days:** ${days}\n⏰ **Hours:** ${hours}\n⏲️ **Minutes:** ${minutes}\n⏱️ **Seconds:** ${seconds}`
            )
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
