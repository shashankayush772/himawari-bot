const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('🔊 Adjust the music volume')
        .addIntegerOption(opt => opt.setName('level').setDescription('Volume level (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const level = interaction.options.getInteger('level');
        queue.setVolume(level);
        await interaction.reply(`🔊 Volume set to **${level}%**`);
    },
};
