const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('💋 Send a kiss to someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to kiss').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');

        try {
            const { data } = await axios.get('https://some-random-api.com/animu/kiss');

            const embed = new EmbedBuilder()
                .setTitle(`${interaction.user.username} kisses ${user.username} 💋`)
                .setImage(data.link)
                .setColor(0xFF1493)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a kiss GIF. Try again later!', ephemeral: true });
        }
    },
};