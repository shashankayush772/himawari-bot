const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('🐌 Set slowmode for a channel')
        .addIntegerOption(opt =>
            opt.setName('seconds').setDescription('Slowmode duration in seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600)
        )
        .addChannelOption(opt =>
            opt.setName('channel').setDescription('Target channel (defaults to current)')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        await channel.setRateLimitPerUser(seconds);

        const embed = new EmbedBuilder()
            .setDescription(seconds === 0
                ? `✅ Slowmode has been **disabled** in ${channel} by **${interaction.user.tag}**`
                : `🐌 Slowmode set to **${seconds}s** in ${channel} by **${interaction.user.tag}**`)
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};