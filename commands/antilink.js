const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getConfig, setEnabled, toggleWhitelistChannel, toggleWhitelistRole } = require('../utils/antilink-db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antilink')
        .setDescription('🛡️ Configure the Anti-Link system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('toggle')
            .setDescription('Turn Anti-Link on or off')
            .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable or disable').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('whitelist-channel')
            .setDescription('Toggle a channel in the Anti-Link whitelist')
            .addChannelOption(opt => opt.setName('channel').setDescription('The channel to whitelist/unwhitelist').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('whitelist-role')
            .setDescription('Toggle a role in the Anti-Link whitelist')
            .addRoleOption(opt => opt.setName('role').setDescription('The role to whitelist/unwhitelist').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('status')
            .setDescription('View the current Anti-Link configuration')
        ),

    async execute(interaction) {
        const subCmd = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (subCmd === 'toggle') {
            const enabled = interaction.options.getBoolean('enabled');
            await setEnabled(guildId, enabled);
            return interaction.reply({ content: `🛡️ Anti-Link system has been **${enabled ? 'ENABLED' : 'DISABLED'}**.`, ephemeral: true });
        }

        if (subCmd === 'whitelist-channel') {
            const channel = interaction.options.getChannel('channel');
            const added = await toggleWhitelistChannel(guildId, channel.id);
            if (added) {
                return interaction.reply({ content: `✅ Channel <#${channel.id}> has been **whitelisted**. Links can now be sent there.`, ephemeral: true });
            } else {
                return interaction.reply({ content: `❌ Channel <#${channel.id}> has been **removed from the whitelist**.`, ephemeral: true });
            }
        }

        if (subCmd === 'whitelist-role') {
            const role = interaction.options.getRole('role');
            const added = await toggleWhitelistRole(guildId, role.id);
            if (added) {
                return interaction.reply({ content: `✅ Role <@&${role.id}> has been **whitelisted**. Members with this role can send links anywhere.`, ephemeral: true });
            } else {
                return interaction.reply({ content: `❌ Role <@&${role.id}> has been **removed from the whitelist**.`, ephemeral: true });
            }
        }

        if (subCmd === 'status') {
            const config = getConfig(guildId);
            
            const channels = config.whitelistedChannels?.length > 0 ? config.whitelistedChannels.map(id => `<#${id}>`).join(' ') : 'None';
            const roles = config.whitelistedRoles?.length > 0 ? config.whitelistedRoles.map(id => `<@&${id}>`).join(' ') : 'None';

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Link Status')
                .setColor(config.enabled ? 0x00FF00 : 0xFF0000)
                .addFields(
                    { name: 'Status', value: config.enabled ? '🟢 Enabled' : '🔴 Disabled', inline: false },
                    { name: 'Whitelisted Channels', value: channels, inline: false },
                    { name: 'Whitelisted Roles', value: roles, inline: false }
                )
                .setFooter({ text: interaction.guild.name })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
