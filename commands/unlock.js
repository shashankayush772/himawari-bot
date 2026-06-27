const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('🔓 Lift a lockdown on a channel or the server')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('What do you want to unlock?')
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
                    SendMessages: null
                }, { reason: `Unlock initiated by ${interaction.user.tag}` });

                const embed = new EmbedBuilder()
                    .setTitle('🔓 Channel Unlocked')
                    .setColor(0x2ECC71)
                    .setDescription('The lockdown has been lifted. Regular members can chat here again.');

                await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ I do not have permission to unlock this channel.');
            }
        } else if (target === 'server') {
            try {
                // Restore SendMessages to the @everyone role at the server level.
                const currentPerms = everyoneRole.permissions.add(PermissionFlagsBits.SendMessages);
                await everyoneRole.setPermissions(currentPerms, `Server unlock initiated by ${interaction.user.tag}`);

                const embed = new EmbedBuilder()
                    .setTitle('🔓 SERVER LOCKDOWN LIFTED 🔓')
                    .setColor(0x2ECC71)
                    .setDescription('The server lockdown has been lifted. Public channels are now open for chatting again.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ I do not have high enough permissions to edit the `@everyone` role for a server unlock.');
            }
        }
    },
};
