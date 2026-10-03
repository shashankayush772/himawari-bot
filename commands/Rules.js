const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('📜 Display the official server rules')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        // Defer instantly so the interaction doesn't expire if sending takes >3 seconds
        await interaction.deferReply({ ephemeral: true });

        const serverName = interaction.guild?.name || 'this server';

        const rulesText = [
            `Welcome to **${serverName}**. By staying here, you agree to follow all rules below.`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            `📋 **Official Policies**`,
            `[Discord Terms of Service](https://discord.com/terms)`,
            `[Discord Community Guidelines](https://discord.com/guidelines)`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `🤝 **Respect Is Mandatory**`,
            `• Respect all members and staff`,
            `• No harassment, hate speech, or toxicity`,
            `• No personal attacks`,
            ``,
            `👮 **Respect Staff**`,
            `• Follow mod/admin instructions`,
            `• Do not argue about warnings publicly`,
            `• Contact staff privately for issues`,
            ``,
            `🚫 **No Spam / No Ads**`,
            `• No spam, flooding, or excessive mentions`,
            `• No self-promo or server invites`,
            `• No NSFW content`,
            ``,
            `🛡️ **No Scams / No ALT Accounts**`,
            `• Scamming = instant ban`,
            `• 2nd ID (ALT) not allowed`,
            `• Both accounts will be banned if caught`,
            ``,
            `🎤 **Voice & Chat Rules**`,
            `• No voice changers for trolling`,
            `• No mic spam or soundboard abuse`,
            `• No abusing members`,
            ``,
            `🌐 **Language Rule**`,
            `• Only Hindi & English allowed`,
            ``,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `⚠️ **Punishments**`,
            ``,
            `Warning → Mute → Kick → Timeout → Permanent Ban`,
            ``,
            `Staff decisions are final.`,
            ``,
            `🔥 Enjoy your stay in **${serverName}** — Stay Powerful. Stay Respectful.`,
        ].join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`${serverName} – OFFICIAL SERVER RULES`)
            .setDescription(rulesText)
            .setColor(0x2B2D31)
            .setThumbnail(interaction.guild?.iconURL({ dynamic: true, size: 512 }) || null)
            .setTimestamp();

        try {
            // Send as a separate message to the channel
            await interaction.channel.send({ embeds: [embed] });
            // Edit the ephemeral reply to hide the command execution
            await interaction.editReply({ content: '✅ Rules posted successfully.' });
        } catch (error) {
            console.error('Rules command error:', error);
            await interaction.editReply({ 
                content: `❌ Error posting rules to this channel: \`${error.message}\`\nPlease check my permissions!`
            });
        }
    },
};