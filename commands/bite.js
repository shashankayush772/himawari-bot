const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} bites {target}! Nom nom~ 🦷',
    'Chomp! {user} just bit {target}! 😬',
    '{user} playfully bites {target}\'s arm! Ouch~ 🐾',
    'Nom nom! {user} can\'t stop biting {target}! 🦷💕',
    '{user} takes a big bite out of {target}! Tasty~ 😋',
    '{user} nibbles on {target}~ How cute! 🌸',
    'Watch out! {user} is biting {target}! 🐺',
    '{user} gives {target} a vampire bite! 🧛',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bite')
        .setDescription('🦷 Bite someone playfully!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to bite').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/bite');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xDC143C)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a bite GIF. Try again later!', ephemeral: true });
        }
    },
};
