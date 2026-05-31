const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('🔗 Get the bot invite link'),

    async execute(interaction) {
        const inviteURL = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;

        const embed = new EmbedBuilder()
            .setColor(0x00FFEB)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTitle('🔗 **Invite Bot**')
            .setDescription(`**Hey! You can invite this bot by clicking the link below!**\n\n[**Bot Invite**](${inviteURL})`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};