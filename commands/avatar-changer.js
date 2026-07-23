const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-avatar')
        .setDescription('🖼️ Change the bot\'s avatar')
        .addStringOption(opt => opt.setName('url').setDescription('Image URL for the new avatar').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (interaction.user.id !== '814328153513525308') {
            return interaction.reply({ content: '❌ You are not the bot owner.', ephemeral: true });
        }

        const url = interaction.options.getString('url');
        await interaction.deferReply({ ephemeral: true });

        try {
            await interaction.client.user.setAvatar(url);
            await interaction.editReply('✅ Bot avatar has been changed!');
        } catch {
            await interaction.editReply('❌ Failed to change avatar. Check the URL or try again later (rate limited).');
        }
    },
};