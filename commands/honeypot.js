const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setHoneypotChannel, getStats } = require('../utils/honeypot-db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('honeypot')
        .setDescription('🍯 Setup a honeypot channel to automatically ban spam bots')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Create the trap channel')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'setup') {
            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;

            try {
                // Create the channel
                const channel = await guild.channels.create({
                    name: 'honeypot-trap',
                    type: ChannelType.GuildText,
                    topic: '🍯 DO NOT SEND MESSAGES HERE. You will be banned instantly.',
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages]
                        }
                    ],
                    reason: `Honeypot setup by ${interaction.user.tag}`
                });

                // Save to DB
                await setHoneypotChannel(guild.id, channel.id);

                // Fetch initial stats
                const stats = await getStats(guild.id);

                // Create the scary embed
                const embed = new EmbedBuilder()
                    .setTitle('DO NOT SEND MESSAGES IN THIS CHANNEL')
                    .setDescription('This channel is used to catch spam bots. Any messages sent here will result in a **softban**.')
                    .setColor(0x2B2D31)
                    .setThumbnail('https://cdn.discordapp.com/emojis/1075709099083317318.gif?size=512');

                // Create the button
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('honeypot_stats_btn')
                        .setLabel(`Kicks: ${stats.serverKicks}`)
                        .setEmoji('🍯')
                        .setStyle(ButtonStyle.Secondary)
                );

                // Send to the new channel
                await channel.send({ embeds: [embed], components: [row] });

                // Reply to the admin
                await interaction.editReply(`✅ Honeypot successfully set up in ${channel}!`);

            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ Failed to create the honeypot channel. Do I have Manage Channels permissions?');
            }
        }
    },
};
