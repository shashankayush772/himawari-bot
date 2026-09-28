const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} winks at {target}! How charming~ 😉✨',
    '{user} gives {target} a flirty little wink~ 💫',
    '{user} sends a playful wink to {target}! 😏💕',
    'Did {user} just wink at {target}?! How smooth~ 🌟',
    '{user} catches {target}\'s eye and winks! 💖',
    '{user} throws a cute wink at {target}! Kawaii~ 🌸',
    '{user} winks at {target} from across the room! 💝',
    'Ooh~ {user} is being flirty and winking at {target}! 😘',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wink')
        .setDescription('😉 Send a cute anime wink to someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to wink at').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/wink');
            const data = await res.json();
            const gifUrl = data.results[0].url;
            const animeName = data.results[0].anime_name;

            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(gifUrl)
                .setColor(0x9B59B6)
                .setFooter({ text: `Anime: ${animeName}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a wink GIF. Try again later!', ephemeral: true });
        }
    },
};