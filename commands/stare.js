const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} stares at {target} menacingly... 👁️',
    '{user} won\'t stop staring at {target}... creepy~ 😐',
    '{user} gives {target} the death stare! 💀👁️',
    '{user} is intensely staring at {target}... what did they do? 🤨',
    '{user} locks eyes with {target}... intimidating~ 👁️🔥',
    'The way {user} is staring at {target}... scary! 😱',
    '{user} stares deep into {target}\'s soul! 👁️✨',
    '{user} won\'t look away from {target}... 👀💢',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stare')
        .setDescription('👁️ Stare at someone menacingly!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to stare at').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/stare');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0x4B0082)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a stare GIF. Try again later!', ephemeral: true });
        }
    },
};
