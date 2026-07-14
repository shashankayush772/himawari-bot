const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Resumes the current song'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        if (!queue || !queue.node.isPaused()) {
            return interaction.reply({ content: '❌ The music is not paused!', ephemeral: true });
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.channel.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true });
        }

        queue.node.setPaused(false);
        await interaction.reply('▶️ Resumed the music!');
    },
};
