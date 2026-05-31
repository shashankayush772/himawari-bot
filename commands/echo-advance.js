const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo-advanced')
        .setDescription('📢 Repeat any text 30+ times (fun/spam)')
        .addStringOption(opt =>
            opt.setName('text').setDescription('The text to repeat').setRequired(true)
        ),

    async execute(interaction) {
        const text = interaction.options.getString('text');

        await interaction.reply(text);
        for (let i = 0; i < 30; i++) {
            await interaction.channel.send(text);
        }
    },
};