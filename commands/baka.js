const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} calls {target} a BAKA! 😤',
    'B-Baka! {user} thinks {target} is an idiot! 💢',
    '{user} screams "BAKA!" at {target}! 😡',
    'It\'s not like {user} likes {target} or anything... BAKA! 😤💕',
    '{user} can\'t believe how dumb {target} is... Baka! 🤦',
    'BAKA BAKA BAKA! {user} is done with {target}! 💢💢',
    '{user} blushes and calls {target} a baka! 😳💢',
    '{user} hits {target} with the ultimate "BAKA!" 🔥',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baka')
        .setDescription('😤 Call someone a baka!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The baka').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/baka');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xFF6347)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a baka GIF. Try again later!', ephemeral: true });
        }
    },
};
