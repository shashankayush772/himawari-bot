const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} punches {target} right in the face! 👊💥',
    'WHAM! {user} lands a punch on {target}! 💢',
    '{user} gives {target} a playful punch! Ouch~ 😤',
    'POW! {user} just punched {target}! That\'s gotta hurt! 🥊',
    '{user} goes full anime mode and punches {target}! 💫',
    '{user} unleashes their fury on {target}! Take that! 👊🔥',
    'K.O.! {user} knocked out {target} with one punch! 💀',
    '{user} couldn\'t hold back and punched {target}! 😡💢',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('punch')
        .setDescription('👊 Punch someone with a cute anime GIF!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to punch').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/punch');
            const data = await res.json();
            const gifUrl = data.results[0].url;
            const animeName = data.results[0].anime_name;

            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(gifUrl)
                .setColor(0xE74C3C)
                .setFooter({ text: `Anime: ${animeName}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a punch GIF. Try again later!', ephemeral: true });
        }
    },
};