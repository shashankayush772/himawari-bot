const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { parse } = require('twemoji-parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enlarge')
        .setDescription('🔍 Enlarge an emoji to full size')
        .addStringOption(opt =>
            opt.setName('emoji').setDescription('The emoji to enlarge').setRequired(true)
        ),

    async execute(interaction) {
        const emoji = interaction.options.getString('emoji');

        // Check for custom Discord emoji: <:name:id> or <a:name:id>
        const customMatch = emoji.match(/<(a)?:(\w+):(\d+)>/);

        const embed = new EmbedBuilder()
            .setTitle(`Enlarged: ${emoji}`)
            .setColor(0xFEE75C);

        if (customMatch) {
            const animated = customMatch[1] === 'a';
            const id = customMatch[3];
            embed.setImage(`https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=512`);
        } else {
            const parsed = parse(emoji, { assetType: 'png' });
            if (!parsed[0]) {
                return interaction.reply({ content: '❌ Invalid emoji!', ephemeral: true });
            }
            embed.setImage(parsed[0].url);
        }

        await interaction.reply({ embeds: [embed] });
    },
};