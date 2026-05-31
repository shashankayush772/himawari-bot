const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('👢 Kick a member from the server')
        .addUserOption(opt => opt.setName('user').setDescription('The member to kick').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');

        if (!member) return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        if (!member.kickable) return interaction.reply({ content: '❌ I cannot kick this member.', ephemeral: true });

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setTitle('👢 Action: Kick')
            .setDescription(`Kicked **${member.user.username}** (${member.id})`)
            .setColor(0x028EA4)
            .addFields({ name: 'Reason', value: reason })
            .setFooter({ text: `Kicked by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};