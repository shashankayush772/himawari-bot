const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('🔁 Toggles the loop mode')
        .addStringOption(opt => opt.setName('mode')
            .setDescription('Loop mode')
            .setRequired(true)
            .addChoices(
                { name: 'Off', value: 'off' },
                { name: 'Track', value: 'track' },
                { name: 'Queue', value: 'queue' }
            )
        ),

    async execute(interaction) {
        const modeInput = interaction.options.getString('mode');
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Nothing is playing right now!', ephemeral: true });
        }

        const member = interaction.member;
        if (!member?.voice?.channel || member.voice.channel.id !== queue.channel.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel!', ephemeral: true });
        }

        const modes = {
            'off': 0,
            'track': 1,
            'queue': 2
        };

        const displayModes = {
            'off': 'Off',
            'track': '🔂 Song Loop',
            'queue': '🔁 Queue Loop'
        };

        queue.setRepeatMode(modes[modeInput]);
        await interaction.reply(`🔁 Loop set to **${displayModes[modeInput]}**!`);
    },
};
