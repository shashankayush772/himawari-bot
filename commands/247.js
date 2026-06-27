const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('♾️ Toggle 24/7 mode to keep the bot in the voice channel permanently'),
    
    async execute(interaction) {
        const voice = interaction.member?.voice?.channel;
        if (!voice) {
            return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });
        }

        let queue = interaction.client.player.queues.get(interaction.guildId);

        // If there's no queue but user is in a VC, create one by joining
        if (!queue) {
            try {
                queue = interaction.client.player.queues.create(interaction.guildId, {
                    metadata: {
                        channel: interaction.channel,
                        is247: true,
                    },
                    volume: 80,
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    selfDeaf: true,
                });
                await queue.connect(voice);
            } catch (err) {
                console.error('247 join error:', err.message);
                return interaction.reply({ content: '❌ Failed to join the voice channel.', ephemeral: true });
            }
        }

        // Toggle
        const is247 = !queue.metadata?.is247;
        queue.metadata = { ...queue.metadata, is247: is247 };

        // Update queue settings dynamically
        if (is247) {
            // Can't directly update these properties easily after init in some versions, but we'll try options
            queue.options.leaveOnEmpty = false;
            queue.options.leaveOnEnd = false;
            await interaction.reply('♾️ **24/7 Mode Enabled!** The bot will stay in the voice channel permanently, even when the queue is empty.');
        } else {
            queue.options.leaveOnEmpty = true;
            queue.options.leaveOnEnd = true;
            await interaction.reply('🛑 **24/7 Mode Disabled!** The bot will auto-leave after 5 minutes of inactivity.');
        }
    },
};
