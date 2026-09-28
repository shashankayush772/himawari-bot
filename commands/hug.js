const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} wraps {target} in the warmest hug ever! 💕',
    '{user} gives {target} a big bear hug! 🧸',
    '{user} hugs {target} tightly and never wants to let go~ 🥰',
    '{user} sneaks up behind {target} and hugs them! 💖',
    '{user} gives {target} a cozy hug! So warm~ ☁️',
    'Aww! {user} is hugging {target}! How cute~ 🌸',
    '{user} pulls {target} into a soft, gentle hug 🫶',
    '{user} ran towards {target} and tackled them with a hug! 💗',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('🤗 Send a cute anime hug to someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to hug').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/hug');
            const data = await res.json();
            const gifUrl = data.results[0].url;
            const animeName = data.results[0].anime_name;

            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(gifUrl)
                .setColor(0xFF69B4)
                .setFooter({ text: `Anime: ${animeName}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a hug GIF. Try again later!', ephemeral: true });
        }
    },
};