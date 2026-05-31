const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const wiki = require('wikijs').default();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wikipedia')
        .setDescription('📚 Search Wikipedia for any topic')
        .addStringOption(opt =>
            opt.setName('query').setDescription('What to search for').setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        await interaction.deferReply();

        try {
            const search = await wiki.search(query);

            if (!search.results.length) {
                const embed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle('📚 Nothing Found')
                    .setDescription('Even Wikipedia doesn\'t know what you\'re talking about!')
                    .setFooter({ text: 'Check for typos or try something else.' });
                return interaction.editReply({ embeds: [embed] });
            }

            const page = await wiki.page(search.results[0]);
            let summary = await page.summary();

            if (summary.length > 4000) {
                summary = summary.substring(0, 4000) + `...\n\n[**Read more**](${page.raw.fullurl})`;
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: page.raw.title })
                .setColor(0x57F287)
                .setDescription(summary)
                .setURL(page.raw.fullurl)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ An error occurred while searching Wikipedia.');
        }
    },
};