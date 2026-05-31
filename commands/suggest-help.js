const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggesthelp')
        .setDescription('💡 Learn how to submit a suggestion'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setTitle('💡 How to Submit a Suggestion')
            .setDescription('Use the `/suggest` command to send a suggestion directly to the developers!\n\n**Example:**\n`/suggest suggestion:Add a music feature`')
            .setFooter({ text: 'We appreciate your feedback!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};