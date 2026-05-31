const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('🤗 Send a hug to someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to hug').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');

        try {
            const { data } = await axios.get('https://some-random-api.com/animu/hug');

            const embed = new EmbedBuilder()
                .setTitle(`${interaction.user.username} hugs ${user.username} 🤗`)
                .setImage(data.link)
                .setColor(0xFF69B4)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a hug GIF. Try again later!', ephemeral: true });
        }
    },
};