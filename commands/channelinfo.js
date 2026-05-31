const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('📺 Display information about a channel')
        .addChannelOption(opt =>
            opt.setName('channel').setDescription('The channel to inspect (defaults to current)')
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const embed = new EmbedBuilder()
            .setTitle(`📺 Channel Info: #${channel.name}`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setColor(0x57F287)
            .addFields(
                { name: '🆔 Channel ID', value: channel.id, inline: true },
                { name: '📋 Type', value: `${channel.type}`, inline: true },
                { name: '🔞 NSFW', value: `${channel.nsfw || false}`, inline: true },
                { name: '📝 Topic', value: channel.topic || 'No description', inline: false },
                { name: '📅 Created', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};