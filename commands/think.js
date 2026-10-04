const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '**{user}** is thinking really hard... 🤔',
    'Hmm... **{user}** is deep in thought! 💭',
    '**{user}** is pondering the meaning of life... 🤔✨',
    'What is **{user}** thinking about? 💭🧠',
    '**{user}** activates big brain mode! 🧠🔥',
    '**{user}** thinks... and thinks... and thinks... 🤔💫',
    'The gears in **{user}**\'s head are turning! ⚙️💭',
    '**{user}** is having a galaxy brain moment! 🌌🧠',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('think')
        .setDescription('🤔 Show that you\'re thinking!'),

    async execute(interaction) {
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', interaction.user.username);

        try {
            const res = await fetch('https://nekos.best/api/v2/think');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0x9370DB)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a think GIF. Try again later!', ephemeral: true });
        }
    },
};
