const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('🎭 Display information about a role')
        .addRoleOption(opt =>
            opt.setName('role').setDescription('The role to inspect').setRequired(true)
        ),

    async execute(interaction) {
        const role = interaction.options.getRole('role');

        const embed = new EmbedBuilder()
            .setColor(role.hexColor === '#000000' ? 0x2F3136 : role.color)
            .setTitle(`🎭 Role Info: ${role.name}`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID', value: `\`${role.id}\``, inline: true },
                { name: '📛 Name', value: role.name, inline: true },
                { name: '🎨 Color', value: role.hexColor, inline: true },
                { name: '👥 Members', value: `${role.members.size}`, inline: true },
                { name: '📊 Position', value: `${role.position}`, inline: true },
                { name: '📢 Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true }
            )
            .setFooter({ text: interaction.member.displayName, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};