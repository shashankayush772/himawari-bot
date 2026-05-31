const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('📩 Send a DM to a user via the bot')
        .addUserOption(opt => opt.setName('user').setDescription('The user to DM').setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('The message to send').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const message = interaction.options.getString('message');

        try {
            await user.send(message);
            await interaction.reply({ content: `✅ Sent a DM to **${user.tag}**.`, ephemeral: true });
        } catch {
            await interaction.reply({ content: `❌ Could not DM **${user.tag}**. They may have DMs disabled.`, ephemeral: true });
        }
    },
};