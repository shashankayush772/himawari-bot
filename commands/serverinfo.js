const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('🏠 Display detailed information about this server'),

    async execute(interaction) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();

        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const humans = guild.members.cache.filter(m => !m.user.bot).size;

        const embed = new EmbedBuilder()
            .setTitle('📋 **Server Information**')
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .addFields(
                { name: '🎫 Name', value: guild.name, inline: true },
                { name: '🆔 ID', value: guild.id, inline: true },
                { name: '👑 Owner', value: `${owner.user}`, inline: true },
                { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
                { name: '🤖 Bots', value: `${bots}`, inline: true },
                { name: '🚶 Humans', value: `${humans}`, inline: true },
                { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                { name: '✨ Animated Emojis', value: `${guild.emojis.cache.filter(e => e.animated).size}`, inline: true },
                { name: '💬 Text Channels', value: `${textChannels}`, inline: true },
                { name: '🎤 Voice Channels', value: `${voiceChannels}`, inline: true },
                { name: '👔 Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};