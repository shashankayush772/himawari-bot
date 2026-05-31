const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('👤 Display detailed info about a user')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The user to inspect (defaults to you)')
        ),

    async execute(interaction) {
        const member = interaction.options.getMember('user') || interaction.member;
        const user = member.user;

        const status = member.presence?.status || 'offline';
        const statusEmoji = { online: '🟢', idle: '🌙', dnd: '⛔', offline: '⚫' };
        const activity = member.presence?.activities?.[0]?.name || 'No activity';

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Info`)
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '👤 Name', value: user.username, inline: true },
                { name: '🆔 ID', value: user.id, inline: true },
                { name: `${statusEmoji[status]} Status`, value: status, inline: true },
                { name: '🎮 Activity', value: activity, inline: true },
                { name: '🖼️ Avatar', value: `[Click Here](${user.displayAvatarURL({ dynamic: true })})`, inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🎭 Roles', value: member.roles.cache.map(r => r.toString()).join(' ') || 'None' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};