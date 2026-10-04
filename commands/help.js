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
                    name: '🛡️ Security Commands',
                    value: '`/honeypot` `/lockdown` `/unlock` `/secure` `/quarantine` `/scan`'
                },
                {
                    name: '🤖 AI & Social',
                    value: '`/ai` `/translate` `/ytnotify` `/youtube`'
                },
                {
                    name: '🔨 Moderation Commands',
                    value: '`/ban` `/kick` `/purge` `/slowmode` `/setnick` `/roleadd` `/roledel` `/nuke` `/unban` `/unbanall` `/dm`'
                },
                {
                    name: '🔧 Utility & Info',
                    value: '`/ping` `/botinfo` `/invite` `/uptime` `/avatar` `/userinfo` `/serverinfo` `/channelinfo` `/roleinfo` `/members` `/screenshot` `/wikipedia` `/weather`'
                },
                {
                    name: '🎱 Fun & Games',
                    value: '`/8ball` `/coinflip` `/meme` `/enlarge` `/steal` `/facepalm`'
                },
                {
                    name: '🎭 Anime & Roleplay',
                    value: '`/hug` `/kiss` `/wink` `/punch` `/pat` `/cuddle` `/poke` `/bite` `/handhold` `/highfive` `/wave` `/baka` `/cry` `/blush` `/smile` `/happy` `/laugh` `/think` `/yeet` `/slap` `/shoot` `/stare`'
                },
                {
                    name: '📋 Community',
                    value: '`/help` `/rules` `/bughelp` `/bugreport` `/suggesthelp` `/suggest`'
                },
                {
                    name: '🔗 Other',
                    value: '`/echo` `/echo-advanced` `/say` `/say-embed` `/getinvite` `/pending`'
                }
            )
            .setFooter({ text: interaction.guild?.name || 'Himawari Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};