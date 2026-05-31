const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wink')
        .setDescription('😉 Send a wink to someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to wink at').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');

        try {
            const { data } = await axios.get('https://some-random-api.com/animu/wink');

            const embed = new EmbedBuilder()
                .setTitle(`${interaction.user.username} winks at ${user.username} 😉`)
                .setImage(data.link)
                .setColor(0x9B59B6)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a wink GIF. Try again later!', ephemeral: true });
        }
    },
};