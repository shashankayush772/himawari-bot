const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('🔀 Shuffles the music queue'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.channel.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true });
        }

        queue.tracks.shuffle();
        await interaction.reply('🔀 Shuffled the queue!');
    },
};
