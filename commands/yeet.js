const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const messages = [
    '{user} yeets {target} into the sun! ☀️💨',
    'YEET! {user} throws {target} across the room! 💨💥',
    '{user} grabs {target} and YEETS them! 🏋️💨',
    'Goodbye! {user} just yeeted {target} into orbit! 🚀',
    '{user} yeeted {target} so hard they disappeared! 💀💨',
    'Full power YEET! {user} launches {target}! 🔥💨',
    '{user} picks up {target} and throws them! YEEEET! 🌪️',
    '{user} yeeted {target} into another dimension! 🌀',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yeet')
        .setDescription('💨 YEET someone!')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The person to yeet').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const msg = messages[Math.floor(Math.random() * messages.length)]
            .replace('{user}', `**${interaction.user.username}**`)
            .replace('{target}', `**${user.username}**`);

        try {
            const res = await fetch('https://nekos.best/api/v2/yeet');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setDescription(msg)
                .setImage(data.results[0].url)
                .setColor(0x00FF00)
                .setFooter({ text: `Anime: ${data.results[0].anime_name}` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Could not fetch a yeet GIF. Try again later!', ephemeral: true });
        }
    },
};
