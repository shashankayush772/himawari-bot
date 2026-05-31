const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reply')
        .setDescription('💬 Generate a fake reply between two members')
        .addUserOption(opt => opt.setName('member1').setDescription('The first member (replier)').setRequired(true))
        .addUserOption(opt => opt.setName('member2').setDescription('The second member (original)').setRequired(true))
        .addStringOption(opt => opt.setName('main_message').setDescription('The original message').setRequired(true))
        .addStringOption(opt => opt.setName('reply_message').setDescription('The reply message').setRequired(true)),

    async execute(interaction) {
        const member1 = interaction.options.getMember('member1');
        const member2 = interaction.options.getMember('member2');
        const mainMsg = interaction.options.getString('main_message');
        const replyMsg = interaction.options.getString('reply_message');

        if (!member1 || !member2) {
            return interaction.reply({ content: '❌ Both members must be in this server.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('💬 Fake Reply')
            .setDescription(
                `╭ **${member2.displayName}** said:\n` +
                `│ *"${mainMsg}"*\n` +
                `╰ ↩️ **${member1.displayName}** replied:\n` +
                `  *"${replyMsg}"*`
            )
            .setThumbnail(member1.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: member2.displayName, iconURL: member2.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};