const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('🔗 Get the invite link to the support server'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('💬 Support Server')
            .setDescription('Need help? Have a question or suggestion?\nJoin our support server!')
            .addFields(
                { name: '🔗 Invite Link', value: '[Click here to join!](https://discord.gg/UvQWCYrcAF)' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
