const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('🔁 Set loop mode for playback')
        .addStringOption(opt =>
            opt.setName('mode').setDescription('Loop mode').setRequired(true)
                .addChoices(
                    { name: '🚫 Off', value: 'off' },
                    { name: '🔂 Track (repeat current)', value: 'track' },
                    { name: '🔁 Queue (repeat all)', value: 'queue' }
                )
        ),

    async execute(interaction) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });

        const mode = interaction.options.getString('mode');
        queue.loop = mode;

        const icons = { off: '🚫', track: '🔂', queue: '🔁' };
        const labels = { off: 'Off', track: 'Looping Current Track', queue: 'Looping Entire Queue' };

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setDescription(`${icons[mode]} Loop mode: **${labels[mode]}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
