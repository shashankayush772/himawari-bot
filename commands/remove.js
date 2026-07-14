const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('🗑️ Removes a specific track from the queue')
        .addIntegerOption(opt => opt.setName('position').setDescription('Queue position').setRequired(true)),

    async execute(interaction) {
        const position = interaction.options.getInteger('position');
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.channel.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true });
        }

        if (position < 1 || position > queue.tracks.size) {
            return interaction.reply({ content: '❌ Invalid track position!', ephemeral: true });
        }

        const track = queue.tracks.toArray()[position - 1];
        queue.removeTrack(track);
        
        await interaction.reply(`🗑️ Removed **${track.title}** from the queue!`);
    },
};
