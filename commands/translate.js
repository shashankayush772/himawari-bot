const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const translate = require('@iamtraction/google-translate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('🌐 Translate text to English')
        .addStringOption(opt => opt.setName('text').setDescription('The text to translate').setRequired(true)),

    async execute(interaction) {
        const text = interaction.options.getString('text');
        await interaction.deferReply();

        try {
            const result = await translate(text, { to: 'en' });

            const embed = new EmbedBuilder()
                .setTitle('🌐 Translation')
                .setColor(0x5865F2)
                .addFields(
                    { name: '📥 Original', value: text },
                    { name: '📤 Translated (English)', value: result.text }
                )
                .setFooter({ text: `Detected language: ${result.from.language.iso || 'unknown'}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ Translation failed. Try again later!');
        }
    },
};