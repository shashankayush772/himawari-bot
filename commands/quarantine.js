const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quarantine')
        .setDescription('🛑 Isolate a suspicious user in a quarantine channel')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to quarantine')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for quarantine')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'Suspicious activity';
        const guild = interaction.guild;

        if (!target) {
            return interaction.editReply('❌ User is not in the server.');
        }

        if (target.id === guild.ownerId || target.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply('❌ You cannot quarantine an Administrator.');
        }

        if (target.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.editReply('❌ I cannot quarantine this user because their role is higher than mine.');
        }

        // Try to find a role named 'Quarantined'
        let quarantineRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'quarantined');

        // If it doesn't exist, create it
        if (!quarantineRole) {
            try {
                quarantineRole = await guild.roles.create({
                    name: 'Quarantined',
                    color: 0x95A5A6,
                    reason: 'Auto-created for quarantine command'
                });

                // Configure all channels to deny ViewChannel for the quarantined role
                const channels = guild.channels.cache;
                for (const [id, channel] of channels) {
                    await channel.permissionOverwrites.create(quarantineRole, {
                        ViewChannel: false,
                        SendMessages: false,
                        Connect: false
                    });
                }
            } catch (err) {
                console.error(err);
                return interaction.editReply('❌ Failed to create the Quarantined role. Make sure I have Manage Roles permission.');
            }
        }

        try {
            // Save their old roles in memory/DB if we were doing a full system, 
            // for now we just remove them and apply quarantine
            const oldRoles = target.roles.cache.filter(r => r.id !== guild.id).map(r => r.id);
            
            // Remove all roles and add quarantine
            await target.roles.set([quarantineRole.id], `Quarantined by ${interaction.user.tag}: ${reason}`);

            const embed = new EmbedBuilder()
                .setTitle('🛑 User Quarantined')
                .setColor(0xE67E22)
                .setDescription(`**User:** ${target.user.tag} (<@${target.id}>)\n**Reason:** ${reason}\n\nThey have been isolated and can no longer view the server.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Failed to apply the quarantine to the user.');
        }
    },
};
