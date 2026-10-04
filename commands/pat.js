const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} pats {target} on the head~ 🥺',
    '{user} gives {target} gentle head pats! 💕',
    'Pat pat~ {user} is petting {target}! So cute~ 🌸',
    '{user} softly pats {target}\'s head... there there~ ☁️',
    'Good job! {user} rewards {target} with head pats! ✨',
    '{user} can\'t stop patting {target}! Too adorable~ 💗',
    '{user} reaches over and pats {target} lovingly~ 🫶',
    'Aww~ {user} is giving {target} the best head pats! 🥰',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pat')
        .setDescription('🥺 Pat someone on the head!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to pat').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/pat');
            const data = await res.json();
            const gifUrl = data.results[0].url;
            const animeName = data.results[0].anime_name;

            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(gifUrl)
                .setColor(0xFFB7C5)
                .setFooter({ text: `Anime: ${animeName}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a pat GIF. Try again later!', ephemeral: true });
        }
    },
};
