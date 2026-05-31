const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roledel')
        .setDescription('➖ Remove a role from a member')
        .addUserOption(opt => opt.setName('user').setDescription('The member').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        if (!member.roles.cache.has(role.id)) {
            const err = new EmbedBuilder().setColor(0xED4245).setDescription(`❌ **${member.displayName}** does not have the **${role.name}** role.`);
            return interaction.reply({ embeds: [err], ephemeral: true });
        }

        try {
            await member.roles.remove(role);
            const ok = new EmbedBuilder().setColor(0x57F287).setDescription(`✅ **${member}** has been removed from **${role.name}**.`);
            await interaction.reply({ embeds: [ok] });
        } catch {
            await interaction.reply({ content: '❌ Failed to remove role. Check bot permissions.', ephemeral: true });
        }
    },
};