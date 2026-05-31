const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getinvite')
        .setDescription('🔗 Generate an invite for a server the bot is in')
        .addStringOption(opt => opt.setName('server').setDescription('Server name or ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const query = interaction.options.getString('server');

        const guild = interaction.client.guilds.cache.get(query)
            || interaction.client.guilds.cache.find(g => g.name.toLowerCase() === query.toLowerCase());

        if (!guild) {
            return interaction.reply({ content: `❌ Bot is not in a server matching \`${query}\`.`, ephemeral: true });
        }

        const channel = guild.channels.cache.find(
            ch => ch.type === ChannelType.GuildText && ch.permissionsFor(guild.members.me).has('CreateInstantInvite')
        );

        if (!channel) {
            return interaction.reply({ content: '❌ No suitable channel found to create an invite.', ephemeral: true });
        }

        try {
            const invite = await channel.createInvite({ maxAge: 0, temporary: false });
            await interaction.reply({ content: `🔗 ${invite.url}`, ephemeral: true });
        } catch {
            await interaction.reply({ content: '❌ Failed to create invite.', ephemeral: true });
        }
    },
};