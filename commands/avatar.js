const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('🖼️ Display a user\'s avatar in full resolution')
        .addUserOption(opt =>
            opt.setName('user').setDescription('The user whose avatar to show (defaults to you)')
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Avatar`)
            .setColor(0xFFEFD5)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};