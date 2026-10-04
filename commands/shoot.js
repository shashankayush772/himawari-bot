const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} shoots {target}! Bang bang! 🔫💥',
    'PEW PEW! {user} opens fire on {target}! 🔫',
    '{user} pulls out the big guns on {target}! 💥🔫',
    '{user} shot {target}! Game over! 💀🔫',
    'Headshot! {user} got {target}! 🎯🔫',
    '{user} goes full anime and shoots {target}! 🔥🔫',
    'BANG! {user} didn\'t miss {target}! 💢🔫',
    '{user} fires at {target}! No survivors! 💥💀',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shoot')
        .setDescription('🔫 Shoot someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The target to shoot').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/shoot');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0x2F4F4F)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a shoot GIF. Try again later!', ephemeral: true });
        }
    },
};
