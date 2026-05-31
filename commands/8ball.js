const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('🎱 Ask the magic 8-ball a question and let fate decide!')
        .addStringOption(opt =>
            opt.setName('question').setDescription('The question to ask').setRequired(true)
        ),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const replies = [
            'Yes.', 'No.', 'Never.', 'Definitely.', 'Ask again later.',
            'Most likely.', 'Absolutely not.', 'Without a doubt.', 'Better not tell you now.',
            'My sources say no.', 'Outlook good.', 'Very doubtful.', 'It is certain.', 'Don\'t count on it.'
        ];
        const result = replies[Math.floor(Math.random() * replies.length)];

        const embed = new EmbedBuilder()
            .setAuthor({ name: '🎱 The 8 Ball says...' })
            .setColor(0xE67E22)
            .addFields(
                { name: '❓ Question', value: question },
                { name: '🎱 Answer', value: result }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};