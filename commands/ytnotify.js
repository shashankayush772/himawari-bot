const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { loadDataAsync, saveDataAsync, resolveChannelId } = require('../utils/yt-live-monitor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ytnotify')
        .setDescription('📺 YouTube Live Stream Notifications')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('🔔 Track a YouTube channel for live stream notifications')
                .addStringOption(opt =>
                    opt.setName('youtube').setDescription('YouTube channel URL or @handle').setRequired(true)
                )
                .addChannelOption(opt =>
                    opt.setName('channel').setDescription('Discord channel to send notifications to').setRequired(true)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
                .addRoleOption(opt =>
                    opt.setName('pingrole').setDescription('Role to mention when live (optional)').setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('🔕 Stop tracking a YouTube channel')
                .addStringOption(opt =>
                    opt.setName('youtube').setDescription('YouTube channel URL, @handle, or channel name').setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('📋 List all tracked YouTube channels')
        )
        .addSubcommand(sub =>
            sub.setName('setmessage')
                .setDescription('✏️ Set a custom notification message for this server')
                .addStringOption(opt =>
                    opt.setName('message').setDescription('Custom message (use {link} for the stream URL)').setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'add') {
            await interaction.deferReply();

            const ytInput = interaction.options.getString('youtube');
            const discordChannel = interaction.options.getChannel('channel');
            const pingRole = interaction.options.getRole('pingrole');

            // Resolve YouTube channel ID
            const resolved = await resolveChannelId(ytInput);
            if (!resolved) {
                return interaction.editReply('❌ Could not find that YouTube channel. Please provide a valid URL like `https://www.youtube.com/@channelname` or a channel ID.');
            }

            const data = await loadDataAsync();
            if (!data.guilds[interaction.guildId]) {
                data.guilds[interaction.guildId] = { tracks: [] };
            }

            const guildTracks = data.guilds[interaction.guildId].tracks;

            // Check if already tracking
            if (guildTracks.some(t => t.channelId === resolved.id)) {
                return interaction.editReply('⚠️ This YouTube channel is already being tracked in this server.');
            }

            // Limit per server
            if (guildTracks.length >= 10) {
                return interaction.editReply('❌ Maximum 10 YouTube channels per server.');
            }

            // Get channel name if not resolved yet
            let channelName = resolved.name || ytInput;

            guildTracks.push({
                channelId: resolved.id,
                channelName: channelName,
                discordChannelId: discordChannel.id,
                mentionRole: pingRole?.id || null,
                addedBy: interaction.user.id,
            });

            await saveDataAsync(data);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('📺 YouTube Live Tracking Added')
                .setDescription(`I'll notify ${discordChannel} when this channel goes live!`)
                .addFields(
                    { name: '🎬 YouTube Channel', value: channelName, inline: true },
                    { name: '📢 Notify In', value: `${discordChannel}`, inline: true },
                    { name: '🔔 Ping Role', value: pingRole ? `${pingRole}` : 'None', inline: true },
                    { name: '🆔 Channel ID', value: `\`${resolved.id}\``, inline: false }
                )
                .setFooter({ text: 'Checks every 2 minutes • Notifies only when LIVE (not scheduled)' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }

        else if (sub === 'remove') {
            const ytInput = interaction.options.getString('youtube').toLowerCase();
            const data = await loadDataAsync();
            const guildData = data.guilds[interaction.guildId];

            if (!guildData || !guildData.tracks || guildData.tracks.length === 0) {
                return interaction.reply({ content: '❌ No YouTube channels are being tracked in this server.', ephemeral: true });
            }

            // Find the track to remove (match by name, ID, or URL)
            const index = guildData.tracks.findIndex(t =>
                t.channelId.toLowerCase() === ytInput ||
                t.channelName.toLowerCase().includes(ytInput) ||
                ytInput.includes(t.channelId.toLowerCase())
            );

            if (index === -1) {
                return interaction.reply({ content: '❌ Could not find that YouTube channel in the tracked list. Use `/ytnotify list` to see tracked channels.', ephemeral: true });
            }

            const removed = guildData.tracks.splice(index, 1)[0];
            await saveDataAsync(data);

            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setDescription(`🔕 Stopped tracking **${removed.channelName}** for live notifications.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        else if (sub === 'list') {
            const data = await loadDataAsync();
            const guildData = data.guilds[interaction.guildId];

            if (!guildData || !guildData.tracks || guildData.tracks.length === 0) {
                return interaction.reply({ content: '📋 No YouTube channels are being tracked in this server.\nUse `/ytnotify add` to start tracking!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('📺 Tracked YouTube Channels')
                .setDescription(
                    guildData.tracks.map((t, i) =>
                        `**${i + 1}.** [${t.channelName}](https://youtube.com/channel/${t.channelId})\n` +
                        `   📢 <#${t.discordChannelId}>${t.mentionRole ? ` • 🔔 <@&${t.mentionRole}>` : ''}`
                    ).join('\n\n')
                )
                .setFooter({ text: `${guildData.tracks.length}/10 slots used • Checks every 2 min` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        else if (sub === 'setmessage') {
            const customMsg = interaction.options.getString('message');
            const data = await loadDataAsync();

            if (!data.guilds[interaction.guildId] || !data.guilds[interaction.guildId].tracks || data.guilds[interaction.guildId].tracks.length === 0) {
                return interaction.reply({ content: '❌ No YouTube channels are being tracked in this server. Use `/ytnotify add` first.', ephemeral: true });
            }

            // Save custom message at the guild level
            data.guilds[interaction.guildId].customMessage = customMsg;
            await saveDataAsync(data);

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Custom Message Set!')
                .setDescription(`Your live notification message has been updated.`)
                .addFields(
                    { name: '📝 Message Preview', value: customMsg.replace('{link}', '`https://youtube.com/watch?v=...`') }
                )
                .setFooter({ text: 'Use {link} in your message to include the stream URL' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};
