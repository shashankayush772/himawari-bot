const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('💣 Clone this channel and delete the original (full purge)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.channel;

        await interaction.reply('💣 Nuking channel...');
        const clone = await channel.clone({ reason: `Channel nuked by ${interaction.user.tag}` });
        await channel.delete();
        await clone.send('💣 **Channel has been nuked!** All messages cleared.');
    },
};