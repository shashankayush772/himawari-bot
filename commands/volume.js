const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('🔊 Set the playback volume')
        .addIntegerOption(opt =>
            opt.setName('level').setDescription('Volume level (0–200)').setRequired(true).setMinValue(0).setMaxValue(200)
        ),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const level = interaction.options.getInteger('level');
        queue.volume = level;
        queue.player.setGlobalVolume(level);

        const bar = '█'.repeat(Math.round(level / 10)) + '░'.repeat(Math.max(20 - Math.round(level / 10), 0));

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`🔊 Volume set to **${level}%**\n\`${bar}\``)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
