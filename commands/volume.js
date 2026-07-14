const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('🔊 Adjust the music volume')
        .addIntegerOption(opt => opt.setName('level').setDescription('Volume level (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const volume = interaction.options.getInteger('level');
        player.setVolume(volume);

        await interaction.reply(`🔊 Volume set to **${volume}%**`);
    },
};
