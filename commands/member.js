const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('members')
        .setDescription('👥 Display a breakdown of server members'),

    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;

        await guild.members.fetch();

        const total = guild.memberCount;
        const humans = guild.members.cache.filter(m => !m.user.bot).size;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const idle = guild.members.cache.filter(m => m.presence?.status === 'idle').size;
        const dnd = guild.members.cache.filter(m => m.presence?.status === 'dnd').size;
        const offline = total - online - idle - dnd;

        const embed = new EmbedBuilder()
            .setColor(0x00FFEB)
            .setTitle('👥 Members Information')
            .setDescription(
                `**Total** — ${total}\n` +
                `**Humans** — ${humans}\n` +
                `**Bots** — ${bots}\n\n` +
                `🟢 Online — **${online}** | 🌙 Idle — **${idle}** | ⛔ DND — **${dnd}** | ⚫ Offline — **${offline}**`
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};