const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, GuildExplicitContentFilter, GuildVerificationLevel } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scan')
        .setDescription('🛡️ Scan the server for security vulnerabilities and get a security score')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        let score = 100;
        const vulnerabilities = [];
        const passed = [];

        const guild = interaction.guild;

        // 1. Verification Level Check
        if (guild.verificationLevel === GuildVerificationLevel.None || guild.verificationLevel === GuildVerificationLevel.Low) {
            score -= 15;
            vulnerabilities.push('⚠️ **Raid Risk:** Server Verification Level is too low. Bot accounts can easily bypass your welcome screen.');
        } else {
            passed.push('✅ Server Verification Level is acceptable.');
        }

        // 2. Moderation 2FA Check
        if (!guild.mfaLevel) {
            score -= 15;
            vulnerabilities.push('⚠️ **Mod Risk:** Moderation 2FA is disabled. If an admin is hacked, the server can be easily nuked.');
        } else {
            passed.push('✅ Moderation 2FA requirement is enabled.');
        }

        // 3. Explicit Content Filter Check
        if (guild.explicitContentFilter !== GuildExplicitContentFilter.AllMembers) {
            score -= 5;
            vulnerabilities.push('⚠️ **Content Risk:** Explicit Content Filter is not set to scan all members.');
        } else {
            passed.push('✅ Explicit Content Filter is active for everyone.');
        }

        // 4. Role Admin Check
        let adminRisk = false;
        guild.roles.cache.forEach(role => {
            if (role.id !== guild.id && !role.managed && role.permissions.has(PermissionFlagsBits.Administrator)) {
                // If it's not the owner's explicit role or it has too many members, flag it
                // For a simple scan, we just flag any non-managed role with Administrator
                adminRisk = true;
            }
        });
        if (adminRisk) {
            score -= 20;
            vulnerabilities.push('⚠️ **Admin Risk:** Found regular roles with the `Administrator` permission. Limit this strictly to owners/managers.');
        } else {
            passed.push('✅ No dangerous Administrator role assignments found.');
        }

        // 5. Mention Everyone Check
        let mentionRisk = false;
        guild.roles.cache.forEach(role => {
            if (role.id === guild.id && role.permissions.has(PermissionFlagsBits.MentionEveryone)) {
                mentionRisk = true;
            }
        });
        if (mentionRisk) {
            score -= 15;
            vulnerabilities.push('⚠️ **Spam Risk:** The `@everyone` role has permission to mention everyone/here.');
        } else {
            passed.push('✅ `@everyone` cannot ping the server.');
        }

        // Ensure score doesn't drop below 0
        score = Math.max(0, score);

        let riskLevel = '🟢 Low Risk';
        let color = 0x2ECC71;
        if (score <= 50) {
            riskLevel = '🔴 Critical Risk';
            color = 0xE74C3C;
        } else if (score <= 80) {
            riskLevel = '🟡 Moderate Risk';
            color = 0xF1C40F;
        }

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Server Security Scan Complete')
            .setColor(color)
            .setDescription(`**Overall Security Score:** \`${score}% (${riskLevel})\`\n\n` +
                (vulnerabilities.length > 0 ? `🔴 **CRITICAL VULNERABILITIES DETECTED:**\n${vulnerabilities.map(v => `* ${v}`).join('\n')}\n\n` : '') +
                `🟢 **PASSED CHECKS:**\n${passed.map(p => `* ${p}`).join('\n')}`
            )
            .setFooter({ text: 'Run /secure to interactively patch these vulnerabilities.' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
