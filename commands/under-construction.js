const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pending')
        .setDescription('🚧 Send an under-construction notice'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🚧 THIS IS UNDER MAINTENANCE!')
            .setImage('https://static.wixstatic.com/media/b3ae7c_4863108e29a747edabbdf983bb1409e7~mv2.gif')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};