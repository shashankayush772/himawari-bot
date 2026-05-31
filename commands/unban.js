const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('🔓 Unban a user by their ID')
        .addStringOption(opt => opt.setName('user_id').setDescription('The user ID to unban').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString('user_id');

        try {
            await interaction.guild.members.unban(userId);
            await interaction.reply(`🔓 Successfully unbanned user \`${userId}\`.`);
        } catch {
            await interaction.reply({ content: '❌ Could not unban that user. Check the ID is correct and they are actually banned.', ephemeral: true });
        }
    },
};
