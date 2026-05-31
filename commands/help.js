const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📖 View all available commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FFEB)
            .setTitle('📖 Command List')
            .setDescription('Here are all the available slash commands, organized by category!')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                {
                    name: '🎵 Music Commands',
                    value: '`/play` `/stop` `/skip` `/pause` `/resume` `/volume` `/nowplaying` `/queue` `/shuffle` `/loop`'
                },
                {
                    name: '🎱 Fun Commands',
                    value: '`/8ball` `/coinflip` `/enlarge` `/echo` `/echo-advanced` `/hug` `/kiss` `/wink` `/punch` `/meme` `/say` `/say-embed`'
                },
                {
                    name: '🔧 Utility Commands',
                    value: '`/ping` `/botinfo` `/invite` `/uptime` `/avatar` `/userinfo` `/serverinfo` `/channelinfo` `/roleinfo` `/members` `/screenshot` `/wikipedia` `/weather` `/youtube`'
                },
                {
                    name: '🔨 Moderation Commands',
                    value: '`/ban` `/kick` `/purge` `/slowmode` `/setnick` `/roleadd` `/roledel` `/nuke` `/unban` `/unbanall` `/dm`'
                },
                {
                    name: '👑 Admin Commands',
                    value: '`/set-avatar` `/status` `/shutdown` `/reload` `/serverlist`'
                },
                {
                    name: '📋 Community & Info',
                    value: '`/help` `/rules` `/bughelp` `/bugreport` `/suggesthelp` `/suggest`'
                },
                {
                    name: '🔗 Other',
                    value: '`/steal` `/facepalm` `/translate` `/getinvite` `/pending`'
                }
            )
            .setFooter({ text: interaction.guild.name })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};