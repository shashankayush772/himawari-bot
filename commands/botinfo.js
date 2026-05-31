const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('node:os');
const cpuStat = require('cpu-stat');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('🤖 Display detailed bot statistics and system info'),

    async execute(interaction) {
        await interaction.deferReply();

        cpuStat.usagePercent(async (err, percent) => {
            if (err) {
                return interaction.editReply('❌ Failed to fetch system stats.');
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle('📊 __**Bot Stats**__')
                .setColor(Math.floor(Math.random() * 0xFFFFFF))
                .addFields(
                    { name: '⏳ Mem Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} / ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: '👥 Users', value: `${interaction.client.users.cache.size}`, inline: true },
                    { name: '📁 Servers', value: `${interaction.client.guilds.cache.size}`, inline: true },
                    { name: '💬 Channels', value: `${interaction.client.channels.cache.size}`, inline: true },
                    { name: '📦 Discord.js', value: `v${version}`, inline: true },
                    { name: '🟢 Node.js', value: `${process.version}`, inline: true },
                    { name: '🖥️ CPU', value: `\`\`\`${os.cpus().map(i => i.model)[0]}\`\`\`` },
                    { name: '📈 CPU Usage', value: `\`${percent.toFixed(2)}%\``, inline: true },
                    { name: '🏗️ Arch', value: `\`${os.arch()}\``, inline: true },
                    { name: '💻 Platform', value: `\`${os.platform()}\``, inline: true },
                    { name: '📡 API Latency', value: `${interaction.client.ws.ping}ms`, inline: true },
                    { name: '👑 Owner', value: 'Ayushh <3', inline: true },
                    { name: '💬 Support', value: '[Join Server](https://discord.gg/UvQWCYrcAF)', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        });
    },
};