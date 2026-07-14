const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('⏭️ Skip to a specific song in the queue')
        .addIntegerOption(opt => opt.setName('position').setDescription('Position of the song to skip to').setRequired(true).setMinValue(1)),

    async execute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const pos = interaction.options.getInteger('position');

        if (pos >= queue.songs.length) {
            return interaction.reply({ content: `❌ Invalid position! Queue only has ${queue.songs.length - 1} songs.`, ephemeral: true });
        }

        try {
            await queue.jump(pos);
            await interaction.reply(`⏭️ Skipped to position **#${pos}**!`);
        } catch (err) {
            await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
        }
    },
};
