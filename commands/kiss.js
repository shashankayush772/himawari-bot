const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} gives {target} a sweet kiss! 💋✨',
    '{user} leans in and kisses {target} softly~ 💕',
    '{user} surprises {target} with a kiss on the cheek! 😘',
    'Kyaa~! {user} just kissed {target}! 💖',
    '{user} steals a kiss from {target}! How bold~ 🌹',
    '{user} kisses {target} gently... everyone is blushing! 🥺',
    '{user} plants a little kiss on {target}\'s forehead~ 💗',
    'Mwah! {user} sends {target} the cutest kiss ever! 💝',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('💋 Send a cute anime kiss to someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to kiss').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/kiss');
            const data = await res.json();
            const gifUrl = data.results[0].url;
            const animeName = data.results[0].anime_name;

            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(gifUrl)
                .setColor(0xFF1493)
                .setFooter({ text: `Anime: ${animeName}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a kiss GIF. Try again later!', ephemeral: true });
        }
    },
};