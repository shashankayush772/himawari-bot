const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('⏩ Seeks to a specific time in the current song')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('Time to seek in seconds').setRequired(true)),

    async execute(interaction) {
        const time = interaction.options.getInteger('seconds');
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.channel.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true });
        }

        await queue.node.seek(time * 1000);
        await interaction.reply(`⏩ Seeked to **${time}s**!`);
    },
};
