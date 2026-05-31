const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('💡 Submit a suggestion to the developers')
        .addStringOption(opt => opt.setName('suggestion').setDescription('Your suggestion').setRequired(true)),

    async execute(interaction) {
        const suggestion = interaction.options.getString('suggestion');
        const channelId = process.env.SUGGESTION_CHANNEL_ID;

        const embed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTitle(`💡 Suggestion from ${interaction.user.username}`)
            .setDescription(suggestion)
            .setTimestamp();

        try {
            const channel = await interaction.client.channels.fetch(channelId);
            if (channel) {
                const msg = await channel.send({ embeds: [embed] });
                await msg.react('✅');
                await msg.react('❌');
            }
        } catch {
            // Channel might not be accessible
        }

        await interaction.reply({ content: '✅ **Your suggestion has been submitted!** Thank you!', ephemeral: true });
    },
};