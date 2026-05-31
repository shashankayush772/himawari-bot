const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setnick')
        .setDescription('📝 Change a member\'s nickname')
        .addUserOption(opt => opt.setName('user').setDescription('The member to rename').setRequired(true))
        .addStringOption(opt => opt.setName('nickname').setDescription('The new nickname').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const nick = interaction.options.getString('nickname');

        if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

        if (member.roles.highest.comparePositionTo(interaction.guild.members.me.roles.highest) >= 0) {
            return interaction.reply({ content: '❌ Cannot change nickname of this user (higher or equal role).', ephemeral: true });
        }

        try {
            const oldName = member.displayName;
            await member.setNickname(nick);

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`✅ Changed nickname of **${oldName}** → **${nick}**`)
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Failed to change nickname. Missing permissions.', ephemeral: true });
        }
    },
};