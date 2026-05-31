const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 Ban a member from the server')
        .addUserOption(opt => opt.setName('user').setDescription('The member to ban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason specified';

        if (!member) return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        if (!member.bannable) return interaction.reply({ content: '❌ I cannot ban this member (higher role or missing permissions).', ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle(`🔨 Banned from ${interaction.guild.name}`)
            .setDescription(`**Reason:** ${reason}`)
            .setColor(0xED4245)
            .setTimestamp();

        await member.send({ embeds: [embed] }).catch(() => {});
        await member.ban({ deleteMessageDays: 7, reason });
        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle('🔨 Member Banned')
                .setDescription(`**${member.user.username}** has been banned.\n**Reason:** ${reason}`)
                .setColor(0xED4245)
                .setFooter({ text: `Banned by ${interaction.user.username}` })
                .setTimestamp()
        ] });
    },
};