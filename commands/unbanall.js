const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unbanall')
        .setDescription('🔓 Unban all banned users from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        await interaction.deferReply();
        const bans = await interaction.guild.bans.fetch();

        if (bans.size === 0) {
            return interaction.editReply('ℹ️ No banned members found.');
        }

        for (const ban of bans.values()) {
            await interaction.guild.members.unban(ban.user).catch(() => {});
        }

        await interaction.editReply(`🔓 Unbanned **${bans.size}** ${bans.size === 1 ? 'user' : 'users'}.`);
    },
};