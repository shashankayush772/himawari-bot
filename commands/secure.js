const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, GuildExplicitContentFilter, GuildVerificationLevel } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('secure')
        .setDescription('🛡️ Interactively patch security vulnerabilities found in the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const proposedFixes = [];
        const actionsToTake = []; // Store functions to run if user approves

        // 1. Verification Level Check
        if (guild.verificationLevel === GuildVerificationLevel.None || guild.verificationLevel === GuildVerificationLevel.Low) {
            proposedFixes.push('Bump Server Verification Level to **Medium** (must be registered on Discord for longer than 5 minutes).');
            actionsToTake.push(async () => {
                await guild.setVerificationLevel(GuildVerificationLevel.Medium, 'Automated security patch');
            });
        }

        // 2. Explicit Content Filter Check
        if (guild.explicitContentFilter !== GuildExplicitContentFilter.AllMembers) {
            proposedFixes.push('Enable Explicit Content Filter for **All Members**.');
            actionsToTake.push(async () => {
                await guild.setExplicitContentFilter(GuildExplicitContentFilter.AllMembers, 'Automated security patch');
            });
        }

        // 3. Mention Everyone Check
        let mentionRisk = false;
        guild.roles.cache.forEach(role => {
            if (role.id === guild.id && role.permissions.has(PermissionFlagsBits.MentionEveryone)) {
                mentionRisk = true;
            }
        });
        if (mentionRisk) {
            proposedFixes.push('Remove `Mention Everyone` permission from the `@everyone` role.');
            actionsToTake.push(async () => {
                const everyoneRole = guild.roles.everyone;
                const currentPerms = everyoneRole.permissions.remove(PermissionFlagsBits.MentionEveryone);
                await everyoneRole.setPermissions(currentPerms, 'Automated security patch - revoked mention everyone');
            });
        }

        if (proposedFixes.length === 0) {
            return interaction.editReply('✅ **Your server is fully secure!** No automated patches are needed right now.');
        }

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Security Patch Manager')
            .setColor(0x5865F2)
            .setDescription('I have analyzed the server and am ready to apply the following security patches:\n\n' +
                proposedFixes.map((f, i) => `${i + 1}. ${f}`).join('\n') +
                '\n\n**Do you want to apply these fixes?**'
            )
            .setFooter({ text: 'This action cannot be undone automatically.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('secure_apply')
                .setLabel('Apply Fixes')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🛡️'),
            new ButtonBuilder()
                .setCustomId('secure_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        const reply = await interaction.editReply({ embeds: [embed], components: [row] });

        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60_000
        });

        collector.on('collect', async i => {
            if (i.customId === 'secure_cancel') {
                await i.update({ content: '❌ Security patches cancelled.', embeds: [], components: [] });
                return;
            }

            if (i.customId === 'secure_apply') {
                await i.update({ content: '⏳ Applying security patches...', embeds: [], components: [] });
                
                let successCount = 0;
                for (const action of actionsToTake) {
                    try {
                        await action();
                        successCount++;
                    } catch (err) {
                        console.error('Failed to apply patch:', err);
                    }
                }

                const resultEmbed = new EmbedBuilder()
                    .setTitle('✅ Security Patches Applied')
                    .setColor(0x2ECC71)
                    .setDescription(`Successfully applied **${successCount}/${actionsToTake.length}** patches.\n\nYour server is now much safer from raids and spam!`);

                await i.editReply({ content: '', embeds: [resultEmbed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '⏱️ Patch request timed out.', embeds: [], components: [] }).catch(() => {});
            }
        });
    },
};
