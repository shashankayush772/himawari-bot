const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('screenshot')
        .setDescription('📸 Take a screenshot of a website')
        .addStringOption(opt =>
            opt.setName('url').setDescription('The website URL (must start with http)').setRequired(true)
        ),

    async execute(interaction) {
        const url = interaction.options.getString('url');

        if (!url.startsWith('http')) {
            return interaction.reply({ content: '❌ Please provide a valid URL starting with `http://` or `https://`', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const screenshotURL = encodeURI(`https://image.thum.io/get/width/1920/crop/1000/noanimate/${url}`);

            const embed = new EmbedBuilder()
                .setTitle('📸 Website Screenshot')
                .setDescription(`[${url}](${url})`)
                .setImage(screenshotURL)
                .setColor(0x5865F2)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ Unable to capture screenshot. Try a different URL!');
        }
    },
};