const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('⚠️ Shut down the bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (interaction.user.id !== '814328153513525308') {
            return interaction.reply({ content: '❌ You are not the bot owner.', ephemeral: true });
        }
        await interaction.reply('👋 Shutting down...');
        interaction.client.destroy();
        process.exit(0);
    },
};
