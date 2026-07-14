const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('🔁 Toggle loop mode (Off → Song → Queue)'),

    async execute(interaction) {
        const player = interaction.client.poru?.players.get(interaction.guildId);
        if (!player) return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });

        const loops = ['NONE', 'TRACK', 'QUEUE'];
        const currentLoop = loops.indexOf(player.loop);
        const nextLoop = loops[(currentLoop + 1) % 3];
        player.setLoop(nextLoop);

        const displayModes = ['❌ Loop Off', '🔂 Looping Current Song', '🔁 Looping Entire Queue'];
        await interaction.reply(displayModes[(currentLoop + 1) % 3]);
    },
};
