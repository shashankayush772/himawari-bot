const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('replay')
        .setDescription('🔄 Replays the current song from the beginning'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.channel.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true });
        }

        await queue.node.seek(0);
        await interaction.reply('🔄 Replaying the song!');
    },
};
