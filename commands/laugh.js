const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '**{user}** is laughing their head off! 😂',
    'LMAOOO **{user}** can\'t stop laughing! 🤣',
    '**{user}** is dying of laughter! 😂💀',
    'Hahahaha! **{user}** finds this hilarious! 🤣✨',
    '**{user}** is rolling on the floor laughing! 🤣🔥',
    'Someone said something funny and **{user}** lost it! 😂',
    '**{user}** is wheezing from laughter! 💨😂',
    '**{user}** laughed so hard they cried! 😂😭',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('laugh')
        .setDescription('😂 Show that you\'re laughing!'),

    async execute(interaction) {
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', interaction.user.username);

        try {
            const res = await fetch('https://nekos.best/api/v2/laugh');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xFFA500)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a laugh GIF. Try again later!', ephemeral: true });
        }
    },
};
