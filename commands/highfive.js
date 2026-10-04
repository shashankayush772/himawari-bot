const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} high fives {target}! ✋🔥',
    'SLAP! {user} and {target} share an epic high five! 💥',
    '{user} gives {target} the hardest high five ever! ✋💢',
    'Nice one! {user} and {target} high five! 🙌',
    '{user} jumps up for a high five with {target}! ✨',
    'The most legendary high five! {user} 🤝 {target}! 🔥',
    '{user} and {target} connect for a perfect high five! ✋💫',
    'Up top! {user} and {target} nail the high five! 🎉',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('highfive')
        .setDescription('✋ High five someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to high five').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/highfive');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xFFD700)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a highfive GIF. Try again later!', ephemeral: true });
        }
    },
};
