const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} cuddles up with {target}~ So cozy! 🧸',
    '{user} wraps a blanket around {target} and cuddles! ☁️',
    'Aww~ {user} and {target} are cuddling together! 💕',
    '{user} snuggles up close to {target}! How warm~ 🥰',
    '{user} pulls {target} into the coziest cuddle ever! 💗',
    'Cuddle time! {user} and {target} are inseparable~ 🫶',
    '{user} holds {target} close and never lets go~ 💖',
    '{user} gives {target} the fluffiest cuddle! 🌸',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cuddle')
        .setDescription('🧸 Cuddle with someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to cuddle').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/cuddle');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xE8A0BF)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a cuddle GIF. Try again later!', ephemeral: true });
        }
    },
};
