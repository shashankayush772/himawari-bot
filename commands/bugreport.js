const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bugreport')
        .setDescription('🐛 Report a bug directly to the developer')
        .addStringOption(opt => opt.setName('report').setDescription('Describe the bug').setRequired(true)),

    async execute(interaction) {
        const report = interaction.options.getString('report');
        const channelId = process.env.BUG_REPORT_CHANNEL_ID;

        const embed = new EmbedBuilder()
            .setTitle('🐛 New Bug Report!')
            .setColor(0xED4245)
            .addFields(
                { name: '👤 Author', value: interaction.user.toString(), inline: true },
                { name: '🏠 Server', value: interaction.guild.name, inline: true },
                { name: '📝 Report', value: report }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        try {
            const channel = await interaction.client.channels.fetch(channelId);
            if (channel) await channel.send({ embeds: [embed] });
        } catch {
            // Channel might not be accessible
        }

        await interaction.reply({ content: '✅ **Bug report has been sent!** Thank you for helping improve the bot.', ephemeral: true });
    },
};