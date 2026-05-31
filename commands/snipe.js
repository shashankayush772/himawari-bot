const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('👀 Show the most recently deleted message in this channel'),

    async execute(interaction) {
        const snipes = interaction.client.snipes;
        const sniped = snipes?.get(interaction.channelId);

        if (!sniped) {
            return interaction.reply({ content: '❌ There is nothing to snipe in this channel!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setAuthor({
                name: sniped.author.tag,
                iconURL: sniped.author.displayAvatarURL({ dynamic: true })
            })
            .setTitle('👀 Sniped Message')
            .setDescription(sniped.content || '*No text content*')
            .setFooter({ text: `Deleted ${timeAgo(sniped.deletedAt)} ago • #${sniped.channelName}` })
            .setTimestamp(sniped.deletedAt);

        if (sniped.attachmentURL) {
            embed.setImage(sniped.attachmentURL);
        }

        await interaction.reply({ embeds: [embed] });
    },
};

function timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
}
