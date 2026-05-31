const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('📡 Change the bot\'s activity status')
        .addStringOption(opt =>
            opt.setName('type').setDescription('Activity type').setRequired(true)
                .addChoices(
                    { name: 'Playing', value: 'Playing' },
                    { name: 'Watching', value: 'Watching' },
                    { name: 'Listening', value: 'Listening' },
                    { name: 'Streaming', value: 'Streaming' },
                    { name: 'Competing', value: 'Competing' }
                )
        )
        .addStringOption(opt => opt.setName('text').setDescription('Status text').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const type = interaction.options.getString('type');
        const text = interaction.options.getString('text');

        const typeMap = {
            Playing: ActivityType.Playing,
            Watching: ActivityType.Watching,
            Listening: ActivityType.Listening,
            Streaming: ActivityType.Streaming,
            Competing: ActivityType.Competing,
        };

        interaction.client.user.setActivity(text, {
            type: typeMap[type],
            url: type === 'Streaming' ? 'https://twitch.tv/placeholder' : undefined,
        });

        const embed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 0xFFFFFF))
            .setTitle(`✅ Status changed to "${type} ${text}"`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};