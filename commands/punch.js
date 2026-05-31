const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const gifs = [
    'https://media1.tenor.com/images/ee3f2a6939a68df9563a7374f131fd96/tenor.gif?itemid=14210784',
    'https://media.tenor.com/images/8e51636630e8eed819dd59f92c928795/tenor.gif',
    'https://media.tenor.com/images/1dcba5faac6462fa788487c99cd678c9/tenor.gif',
    'https://media.tenor.com/images/2dfb030da07fe89448bb636c5e969ece/tenor.gif',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('punch')
        .setDescription('👊 Punch someone (playfully)!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to punch').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const gif = gifs[Math.floor(Math.random() * gifs.length)];

        const embed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setDescription(`**${interaction.user.username}** punched **${user.username}**! 👊`)
            .setImage(gif)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};