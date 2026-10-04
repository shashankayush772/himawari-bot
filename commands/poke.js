const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} pokes {target}! Hey, pay attention! 👉',
    'Poke poke! {user} won\'t stop poking {target}! 😆',
    '{user} gives {target} a sneaky poke~ 👀',
    '{user} keeps poking {target} until they respond! 👉💢',
    'Boop! {user} pokes {target} on the cheek! 😏',
    '{user} is annoying {target} with endless pokes! 👉👉',
    '{user} pokes {target}... are you alive?? 🤔',
    '*poke poke* {user} can\'t resist poking {target}! 💫',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poke')
        .setDescription('👉 Poke someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to poke').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/poke');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0xFFA07A)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a poke GIF. Try again later!', ephemeral: true });
        }
    },
};
