const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '**{user}** is smiling brightly! 😊✨',
    'Look at that smile! **{user}** is happy~ 🌸',
    '**{user}** can\'t stop smiling! 😄💕',
    'That smile from **{user}** is contagious! 😊🔥',
    '**{user}** is beaming with joy! ☀️',
    'Protect **{user}**\'s smile at all costs! 🥺💗',
    '**{user}** flashes the cutest smile! 😊🌟',
    '**{user}** smiles and the whole room lights up! ✨',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('smile')
        .setDescription('😊 Show a happy smile!'),

    async execute(interaction) {
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', interaction.user.username);

        try {
            const res = await fetch('https://nekos.best/api/v2/smile');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xFFD700)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a smile GIF. Try again later!', ephemeral: true });
        }
    },
};
