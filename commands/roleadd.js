const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleadd')
        .setDescription('➕ Add a role to a member')
        .addUserOption(opt => opt.setName('user').setDescription('The member').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('The role to add').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        if (member.roles.cache.has(role.id)) {
            return interaction.reply({ content: `❌ **${member.displayName}** already has the **${role.name}** role.`, ephemeral: true });
        }

        try {
            await member.roles.add(role);
            await interaction.reply(`✅ **${member.displayName}** has been given the **${role.name}** role.`);
        } catch {
            await interaction.reply({ content: '❌ Failed to add role. Check bot permissions and role hierarchy.', ephemeral: true });
        }
    },
};