const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('📢 Mass-ping a user repeatedly (fun/spam)')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The user to echo-ping').setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const line = `${user} ${user} ${user} ${user} ${user} ${user}`;

        await interaction.reply(line);
        for (let i = 0; i < 25; i++) {
            await interaction.channel.send(line);
        }
    },
};