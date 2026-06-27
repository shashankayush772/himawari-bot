const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('🔒 Instantly lock a channel or the entire server to stop raids')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('What do you want to lockdown?')
                .setRequired(true)
                .addChoices(
                    { name: 'This Channel', value: 'channel' },
                    { name: 'Entire Server', value: 'server' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getString('target');
        const guild = interaction.guild;
        const everyoneRole = guild.roles.everyone;

        if (target === 'channel') {
            const channel = interaction.channel;
            
            try {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false
                }, { reason: `Lockdown initiated by ${interaction.user.tag}` });

                const embed = new EmbedBuilder()
                    .setTitle('🔒 Channel Locked')
                    .setColor(0xE74C3C)
                    .setDescription('This channel has been locked down. Regular members can no longer send messages here.')
                    .setFooter({ text: 'Use /unlock channel to restore access.' });

                await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ I do not have permission to lock this channel.');
            }
        } else if (target === 'server') {
            try {
                // To lock the whole server easily, we remove SendMessages from the @everyone role at the server level.
                const currentPerms = everyoneRole.permissions.remove(PermissionFlagsBits.SendMessages);
                await everyoneRole.setPermissions(currentPerms, `Server lockdown initiated by ${interaction.user.tag}`);

                const embed = new EmbedBuilder()
                    .setTitle('🚨 SERVER LOCKDOWN INITIATED 🚨')
                    .setColor(0x992D22)
                    .setDescription('The entire server has been locked down. All public channels are now read-only for regular members to prevent raids/spam.')
                    .setFooter({ text: 'Use /unlock server to lift the lockdown.' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ I do not have high enough permissions to edit the `@everyone` role for a server lockdown.');
            }
        }
    },
};
