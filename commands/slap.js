const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} slaps {target} across the face! 💢',
    'SLAP! {user} just smacked {target}! 👋💥',
    '{user} gives {target} a reality check slap! 😤',
    '{user} slaps some sense into {target}! 💢🔥',
    'Ouch! {user} slapped {target} so hard! 👋💀',
    '{user} winds up and slaps {target}! WHACK! 💥',
    '{user} anime-slaps {target} into next week! 🌀',
    'The slap heard around the world! {user} vs {target}! 👋🔥',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('👋 Slap someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to slap').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/slap');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xFF4500)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a slap GIF. Try again later!', ephemeral: true });
        }
    },
};
