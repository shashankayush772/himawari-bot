const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('🪙 Flip a coin — heads or tails!'),

    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🪙' : '💫';

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`${emoji} **${interaction.member.displayName}** flipped **${result}**!`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};