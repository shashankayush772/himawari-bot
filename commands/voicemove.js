const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voicemove')
        .setDescription('🔀 Move all users from one voice channel to another')
        .addChannelOption(opt =>
            opt.setName('from')
                .setDescription('The voice channel to move users FROM')
                .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
                .setRequired(true)
        )
        .addChannelOption(opt =>
            opt.setName('to')
                .setDescription('The voice channel to move users TO')
                .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

    async execute(interaction) {
        const from = interaction.options.getChannel('from');
        const to = interaction.options.getChannel('to');

        if (!from || !to) {
            return interaction.reply({ content: '❌ Please provide valid voice channels.', ephemeral: true });
        }

        if (from.id === to.id) {
            return interaction.reply({ content: '❌ Source and destination channels cannot be the same!', ephemeral: true });
        }

        const members = from.members;
        if (!members || members.size === 0) {
            return interaction.reply({ content: `❌ No users found in **${from.name}**.`, ephemeral: true });
        }

        await interaction.deferReply();

        let moved = 0;
        let failed = 0;

        for (const [, member] of members) {
            try {
                await member.voice.setChannel(to);
                moved++;
            } catch {
                failed++;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(moved > 0 ? 0x57F287 : 0xED4245)
            .setTitle('🔀 Voice Move')
            .addFields(
                { name: '📤 From', value: `<#${from.id}>`, inline: true },
                { name: '📥 To', value: `<#${to.id}>`, inline: true },
                { name: '✅ Moved', value: `${moved} user(s)`, inline: true },
            )
            .setFooter({ text: `Moved by ${interaction.user.username}${failed > 0 ? ` • ${failed} failed` : ''}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
