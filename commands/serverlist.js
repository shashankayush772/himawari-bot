const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverlist')
        .setDescription('📋 List all servers the bot is in')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (interaction.user.id !== '814328153513525308') {
            return interaction.reply({ content: '❌ You are not the bot owner.', ephemeral: true });
        }

        const guilds = interaction.client.guilds.cache
            .sort((a, b) => b.memberCount - a.memberCount)
            .map((g, i) => `**${i + 1}.** ${g.name} | ${g.memberCount} Members\n\`ID: ${g.id}\``);

        const pages = [];
        for (let i = 0; i < guilds.length; i += 10) {
            pages.push(guilds.slice(i, i + 10).join('\n\n'));
        }
        if (pages.length === 0) pages.push('No servers found.');

        let page = 0;

        const makeEmbed = () => new EmbedBuilder()
            .setColor(0x57F287)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTitle(`📋 Page ${page + 1} / ${pages.length}`)
            .setDescription(`**Total Servers: ${interaction.client.guilds.cache.size}**\n\n${pages[page]}`)
            .setFooter({ text: interaction.client.user.username })
            .setTimestamp();

        const makeRow = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('sl_prev').setLabel('◀').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId('sl_next').setLabel('▶').setStyle(ButtonStyle.Primary).setDisabled(page >= pages.length - 1),
            new ButtonBuilder().setCustomId('sl_close').setLabel('✖').setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.reply({ embeds: [makeEmbed()], components: [makeRow()], fetchReply: true });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Not your buttons!', ephemeral: true });

            if (i.customId === 'sl_prev') page--;
            if (i.customId === 'sl_next') page++;
            if (i.customId === 'sl_close') { collector.stop(); return response.delete().catch(() => {}); }

            await i.update({ embeds: [makeEmbed()], components: [makeRow()] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sl_prev').setLabel('◀').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('sl_next').setLabel('▶').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('sl_close').setLabel('✖').setStyle(ButtonStyle.Danger).setDisabled(true)
            );
            response.edit({ components: [disabledRow] }).catch(() => {});
        });
    },
};