const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say-embed')
        .setDescription('📝 Make the bot say something in a fancy embed')
        .addStringOption(opt =>
            opt.setName('message').setDescription('The message to embed').setRequired(true)
        ),

    async execute(interaction) {
        const message = interaction.options.getString('message');

        const embed = new EmbedBuilder()
            .setDescription(message)
            .setColor(0x00FFEB)
            .setTimestamp();

        await interaction.reply({ content: '✅ Embed sent!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });
    },
};