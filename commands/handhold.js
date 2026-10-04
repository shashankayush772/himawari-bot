const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} holds {target}\'s hand~ 🤝💕',
    '{user} gently takes {target}\'s hand! How romantic~ 💗',
    '{user} and {target} are holding hands! Kawaii~ 🌸',
    '{user} reaches out and holds {target}\'s hand tightly~ 🫶',
    'So cute! {user} won\'t let go of {target}\'s hand! 💖',
    '{user} intertwines fingers with {target}~ 💕',
    '{user} nervously grabs {target}\'s hand... 😳💗',
    'Hand holding?! {user} and {target} are too wholesome! ✨',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('handhold')
        .setDescription('🤝 Hold someone\'s hand!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to hold hands with').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/handhold');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xFFB6C1)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a handhold GIF. Try again later!', ephemeral: true });
        }
    },
};
