const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bughelp')
        .setDescription('🐛 Learn how to report a bug'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setTitle('🐛 How to Report a Bug')
            .setDescription('Use the `/bugreport` command to report a bug directly to the developer!\n\n**Example:**\n`/bugreport report:The kick command is not working`')
            .setFooter({ text: interaction.guild.name })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};