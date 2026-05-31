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

        let queue = interaction.client.queue.get(interaction.guildId);

        // If there's no queue but user is in a VC, create one by joining
        if (!queue) {
            try {
                const player = await interaction.client.shoukaku.joinVoiceChannel({
                    guildId: interaction.guildId,
                    channelId: voice.id,
                    shardId: interaction.guild.shardId,
                    deaf: true,
                });
                player.setGlobalVolume(100);

                queue = interaction.client.queue.create(interaction.guildId, {
                    textChannelId: interaction.channelId,
                    voiceChannelId: voice.id,
                    player,
                });
            } catch (err) {
                console.error('247 join error:', err.message);
                return interaction.reply({ content: '❌ Failed to join the voice channel.', ephemeral: true });
            }
        }

        queue.is247 = !queue.is247;

        if (queue.is247) {
            await interaction.reply('♾️ **24/7 Mode Enabled!** The bot will stay in the voice channel permanently, even when the queue is empty.');
        } else {
            await interaction.reply('🛑 **24/7 Mode Disabled!** The bot will auto-leave after 5 minutes of inactivity.');
        }
    },
};
