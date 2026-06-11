const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// In-memory store: Map<guildId, Map<userId, stickyNick>>
// Exported so index.js can access it for the guildMemberUpdate event
const stickyNicks = new Map();

module.exports = {
    stickyNicks,

    data: new SlashCommandBuilder()
        .setName('setnick')
        .setDescription('📌 Set a sticky nickname that the user cannot change')
        .addUserOption(opt => opt.setName('user').setDescription('The member to rename').setRequired(true))
        .addStringOption(opt => opt.setName('nickname').setDescription('The nickname to stick (leave empty to remove sticky)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const nick = interaction.options.getString('nickname');

        if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

        if (member.roles.highest.comparePositionTo(interaction.guild.members.me.roles.highest) >= 0) {
            return interaction.reply({ content: '❌ Cannot change nickname of this user (higher or equal role).', ephemeral: true });
        }

        const guildId = interaction.guildId;

        // If no nickname provided, remove the sticky nick
        if (!nick) {
            const guildStickies = stickyNicks.get(guildId);
            if (guildStickies) {
                guildStickies.delete(member.id);
                if (guildStickies.size === 0) stickyNicks.delete(guildId);
            }

            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setDescription(`🔓 Removed sticky nickname from **${member.displayName}**. They can change it freely now.`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        try {
            const oldName = member.displayName;
            await member.setNickname(nick);

            // Store the sticky nick
            if (!stickyNicks.has(guildId)) stickyNicks.set(guildId, new Map());
            stickyNicks.get(guildId).set(member.id, nick);

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('📌 Sticky Nickname Set')
                .setDescription(`**${oldName}** → **${nick}**\nThis nickname is now locked — if they try to change it, it will be set back automatically.`)
                .addFields(
                    { name: '👤 User', value: `${member}`, inline: true },
                    { name: '📌 Sticky Nick', value: nick, inline: true }
                )
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Failed to change nickname. Missing permissions.', ephemeral: true });
        }
    },
};