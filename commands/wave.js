const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} waves at {target}! Hello~ 👋✨',
    '{user} waves excitedly at {target}! Over here! 🙋',
    'Hey! {user} is waving at {target}! 👋💕',
    '{user} gives {target} a big cheerful wave! 🌟',
    '{user} spots {target} and waves happily! 👋🎉',
    '{user} waves goodbye to {target}... see you later! 👋😢',
    'Hiii~! {user} waves at {target} from far away! 📣👋',
    '{user} can\'t stop waving at {target}! 👋👋👋',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wave')
        .setDescription('👋 Wave at someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to wave at').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/wave');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0x87CEEB)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a wave GIF. Try again later!', ephemeral: true });
        }
    },
};
