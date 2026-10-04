const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '**{user}** is blushing so hard right now! 😳',
    'Aww~ **{user}** turned bright red! 🥺',
    '**{user}** can\'t hide their blush! 😳💗',
    'Why is **{user}** blushing?! What happened?! 👀',
    '**{user}** is embarrassed and blushing! 😳✨',
    'So cute! **{user}** is all flustered! 🌸',
    '**{user}**\'s face is as red as a tomato! 🍅',
    'B-Baka! **{user}** is blushing like crazy! 😳💕',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blush')
        .setDescription('😳 Show that you\'re blushing!'),

    async execute(interaction) {
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', interaction.user.username);

        try {
            const res = await fetch('https://nekos.best/api/v2/blush');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xFF69B4)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a blush GIF. Try again later!', ephemeral: true });
        }
    },
};
