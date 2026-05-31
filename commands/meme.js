const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('😂 Get a random dank meme from Reddit'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const res = await fetch('https://www.reddit.com/r/dankmemes.json?sort=top&t=week');
            const json = await res.json();
            const posts = json.data.children.filter(p => p.data.post_hint === 'image');

            if (!posts.length) {
                return interaction.editReply('❌ No memes found right now. Try again later!');
            }

            const meme = posts[Math.floor(Math.random() * posts.length)].data;

            const embed = new EmbedBuilder()
                .setTitle(meme.title)
                .setURL(`https://reddit.com${meme.permalink}`)
                .setImage(meme.url)
                .setColor(0xFF4500)
                .setFooter({ text: `👍 ${meme.ups} | 💬 ${meme.num_comments}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ Failed to fetch memes. Try again later!');
        }
    },
};