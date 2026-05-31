const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('🔄 Hot-reload a command without restarting the bot')
        .addStringOption(opt => opt.setName('command').setDescription('Command file name to reload').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const commandName = interaction.options.getString('command').toLowerCase();

        try {
            const filePath = path.join(__dirname, `${commandName}.js`);
            delete require.cache[require.resolve(filePath)];
            const newCommand = require(filePath);

            if ('data' in newCommand && 'execute' in newCommand) {
                interaction.client.commands.set(newCommand.data.name, newCommand);
                await interaction.reply(`✅ Command **${commandName}** reloaded successfully!`);
            } else {
                await interaction.reply({ content: '❌ That file is missing `data` or `execute`.', ephemeral: true });
            }
        } catch (error) {
            await interaction.reply({ content: `❌ Failed to reload **${commandName}**: \`${error.message}\``, ephemeral: true });
        }
    },
};