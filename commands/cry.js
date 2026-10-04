const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '**{user}** is crying... someone comfort them! 😢',
    '**{user}** can\'t hold back the tears... 😭',
    'Why is **{user}** crying?! Who made them sad?! 💔',
    '**{user}** is having a meltdown... 😢💧',
    'Tissues needed! **{user}** won\'t stop crying! 🥺',
    '**{user}** is sobbing uncontrollably... 😭💔',
    'Someone hug **{user}**! They\'re crying! 😢🫂',
    '**{user}** cries a river of tears... 🌊😭',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cry')
        .setDescription('😢 Show that you\'re crying!'),

    async execute(interaction) {
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', interaction.user.username);

        try {
            const res = await fetch('https://nekos.best/api/v2/cry');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0x5DADE2)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a cry GIF. Try again later!', ephemeral: true });
        }
    },
};
