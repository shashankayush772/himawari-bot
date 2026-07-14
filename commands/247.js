const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Track which guilds have 24/7 mode enabled
const guilds247 = new Set();

function is247Enabled(guildId) {
    return guilds247.has(guildId);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('🔄 Toggle 24/7 mode — bot stays in VC even when everyone leaves')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const member = interaction.member;
        const voiceChannel = member?.voice?.channel;

        if (guilds247.has(guildId)) {
            guilds247.delete(guildId);
            return interaction.reply('❌ **24/7 Mode Disabled** — I\'ll leave the VC when everyone\'s gone.');
        } else {
            if (!voiceChannel) {
                return interaction.reply({ content: '❌ You need to be in a voice channel to enable 24/7 mode!', ephemeral: true });
            }

            guilds247.add(guildId);

            // If not already in a VC, join the user's VC
            const poru = interaction.client.poru;
            if (poru && !poru.players.get(guildId)) {
                poru.createConnection({
                    guildId: guildId,
                    voiceChannel: voiceChannel.id,
                    textChannel: interaction.channel.id,
                    deaf: true
                });
            }

            return interaction.reply('✅ **24/7 Mode Enabled** — I\'ll stay in the VC even if everyone leaves! 🔄');
        }
    },

    // Export for use in music-player.js
    is247Enabled,
    guilds247,
};
