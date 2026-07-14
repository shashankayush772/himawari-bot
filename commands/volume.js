const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('🔊 Changes the volume of the music')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Volume amount (0-100)').setRequired(true)),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.channel.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true });
        }

        if (amount < 0 || amount > 100) {
            return interaction.reply({ content: '❌ Volume must be between 0 and 100!', ephemeral: true });
        }

        queue.node.setVolume(amount);
        await interaction.reply(`🔊 Volume set to **${amount}%**!`);
    },
};
