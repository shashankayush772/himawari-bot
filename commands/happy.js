const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '**{user}** is so happy right now! 🎉',
    'Yay! **{user}** is celebrating! 🥳✨',
    '**{user}** is bursting with happiness! 💖🎊',
    'Nothing can bring **{user}** down today! 🌟',
    '**{user}** is on cloud nine! ☁️💕',
    'Pure joy! **{user}** is the happiest person alive! 🥰',
    '**{user}** is vibing and feeling amazing! ✨🔥',
    '**{user}** can\'t contain their happiness! 🎉💗',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('happy')
        .setDescription('🥳 Show that you\'re happy!'),

    async execute(interaction) {
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', interaction.user.username);

        try {
            const res = await fetch('https://nekos.best/api/v2/happy');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0x00FF7F)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a happy GIF. Try again later!', ephemeral: true });
        }
    },
};
