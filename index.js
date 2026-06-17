require('dotenv').config();
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); // Fix Node.js native modules IPv6 hanging

const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const { QueueManager, buildNowPlayingButtons } = require('./utils/queue');
const { MessageAdapter } = require('./utils/message-adapter');
const { startYouTubeLiveMonitor } = require('./utils/yt-live-monitor');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: ['Channel'],
});

// ── DEBUG LOGGING ──────────────────────────────────────────
client.on('debug', info => console.log(`  [DEBUG] ${info}`));
client.on('warn', info => console.warn(`  [WARN] ${info}`));
client.on('error', err => console.error(`  [ERROR]`, err));

client.rest.on('rateLimited', (info) => {
    console.warn(`  [RATE LIMIT] Discord rate limited the bot! Time to wait: ${info.timeToReset}ms. Global: ${info.global}`);
});
client.rest.on('invalidRequestWarning', (info) => {
    console.warn(`  [INVALID REQUEST]`, info);
});

// ── Lavalink (Shoukaku) ────────────────────────────────────
// External nodes only — Render blocks outbound UDP so local Lavalink can't send audio.
// 8 nodes across different providers for maximum uptime.
const lavalinkNodes = [
    // SSL nodes
    { name: 'Jirayu-SSL',     url: 'lavalink.jirayu.net:443',            auth: 'youshallnotpass',               secure: true },
    { name: 'Trinium-SSL',    url: 'lavalink-v4.triniumhost.com:443',    auth: 'free',                          secure: true },
    { name: 'Serenetia-SSL',  url: 'lavalinkv4.serenetia.com:443',       auth: 'https://seretia.link/discord',   secure: true },
    { name: 'MilloHost-SSL',  url: 'lava-v4.millohost.my.id:443',        auth: 'https://discord.gg/mjS5J2K3ep', secure: true },
    // Non-SSL nodes (more providers = more chances one is up)
    { name: 'G3V',            url: 'lava.g3v.co.uk:9008',                auth: 'lavalinklol',                   secure: false },
    { name: 'NexCloud',       url: 'n3.nexcloud.in:2026',                auth: 'nexcloud',                      secure: false },
    { name: 'VexaNode',       url: 'omega.vexanode.cloud:2031',          auth: 'https://discord.vexanode.cloud', secure: false },
    { name: 'Kasawa',         url: 'lava.kasawa.pro:2333',               auth: 'youshallnotpass',               secure: false },
];

console.log(`  🎵 Configured ${lavalinkNodes.length} Lavalink node(s):`, lavalinkNodes.map(n => n.name).join(', '));

client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), lavalinkNodes, {
    moveOnDisconnect: true,
    reconnectTries: 10,
    reconnectInterval: 5000,
});

client.shoukaku.on('ready', (name) => console.log(`  🎵 Lavalink node "${name}" connected`));
client.shoukaku.on('error', (name, error) => console.error(`  ❌ Lavalink "${name}" error:`, error.message));
client.shoukaku.on('close', (name, code, reason) => console.warn(`  ⚠️  Lavalink "${name}" closed [${code}]: ${reason || 'no reason'}`));
client.shoukaku.on('disconnect', (name, players, moved) => {
    console.warn(`  ⚠️  Lavalink "${name}" disconnected. Players affected: ${players.size}. Moved: ${moved}`);
});

// ── Auto-reconnect dead nodes every 2 minutes ──
setInterval(() => {
    const connectedCount = [...client.shoukaku.nodes.values()].filter(n => n.state === 2).length; // 2 = CONNECTED
    if (connectedCount < lavalinkNodes.length) {
        console.log(`  🔄 [AUTO-RECONNECT] ${connectedCount}/${lavalinkNodes.length} nodes connected. Retrying dead nodes...`);
        for (const nodeConfig of lavalinkNodes) {
            const existingNode = client.shoukaku.nodes.get(nodeConfig.name);
            if (!existingNode || existingNode.state !== 2) {
                try {
                    client.shoukaku.addNode(nodeConfig);
                } catch {}
            }
        }
    }
}, 120_000);

client.queue = new QueueManager(client);

// ── Load Commands ──────────────────────────────────────────
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`  ✅ Loaded: /${command.data.name}`);
    } else {
        console.log(`  ⚠️  Skipped ${file}: missing "data" or "execute".`);
    }
}

// ── Interaction Handler ────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
    // ── Now Playing Button Handler ──
    if (interaction.isButton() && interaction.customId.startsWith('np_')) {
        const queue = interaction.client.queue.get(interaction.guildId);
        if (!queue || !queue.current) {
            return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
        }

        const action = interaction.customId.replace('np_', '');

        try {
            switch (action) {
                case 'pause': {
                    const isPaused = queue.player.paused;
                    queue.player.setPaused(!isPaused);
                    const buttons = buildNowPlayingButtons(queue);
                    // Update button appearance (pause ↔ resume)
                    await interaction.update({ components: buttons });
                    break;
                }
                case 'skip': {
                    const skipped = queue.current.info.title;
                    queue.player.stopTrack();
                    await interaction.reply({ content: `⏭️ Skipped **${skipped}**`, ephemeral: true });
                    break;
                }
                case 'stop': {
                    if (queue.is247) {
                        queue.tracks = [];
                        queue.current = null;
                        queue.player.stopTrack();
                        await interaction.reply({ content: '⏹️ Stopped playback. (24/7 mode — staying in channel)', ephemeral: true });
                    } else {
                        queue.tracks = [];
                        queue.current = null;
                        queue.player.stopTrack();
                        await interaction.client.shoukaku.leaveVoiceChannel(interaction.guildId);
                        interaction.client.queue.delete(interaction.guildId);
                        await interaction.reply({ content: '⏹️ Stopped and disconnected.', ephemeral: true });
                    }
                    // Disable buttons
                    try {
                        const disabledRows = interaction.message.components.map(row => {
                            const newRow = ActionRowBuilder.from(row);
                            newRow.components.forEach(btn => btn.setDisabled(true));
                            return newRow;
                        });
                        await interaction.message.edit({ components: disabledRows });
                    } catch {}
                    break;
                }
                case 'loop': {
                    const modes = ['off', 'track', 'queue'];
                    const current = modes.indexOf(queue.loop);
                    queue.loop = modes[(current + 1) % 3];
                    const labels = { off: '🚫 Loop Off', track: '🔂 Looping Track', queue: '🔁 Looping Queue' };
                    const buttons = buildNowPlayingButtons(queue);
                    await interaction.update({ components: buttons });
                    break;
                }
                case 'shuffle': {
                    if (queue.tracks.length < 2) {
                        return interaction.reply({ content: '❌ Not enough tracks to shuffle.', ephemeral: true });
                    }
                    for (let i = queue.tracks.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
                    }
                    await interaction.reply({ content: `🔀 Shuffled **${queue.tracks.length}** tracks!`, ephemeral: true });
                    break;
                }
            }
        } catch (err) {
            console.error('Button handler error:', err.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true }).catch(() => {});
            }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching /${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);

        // ── Command Usage Logger ──
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (logChannelId) {
            try {
                const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
                if (logChannel) {
                    const args = interaction.options.data.map(o => `\`${o.name}:\` ${o.value}`).join('\n') || 'None';
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                        .setTitle(`🔧 /${interaction.commandName}`)
                        .addFields(
                            { name: '👤 User', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '📁 Server', value: interaction.guild?.name || 'DM', inline: true },
                            { name: '💬 Channel', value: `<#${interaction.channelId}>`, inline: true },
                            { name: '📝 Options', value: args }
                        )
                        .setFooter({ text: `User ID: ${interaction.user.id}` })
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            } catch {}
        }
    } catch (error) {
        console.error(`Error in /${interaction.commandName}:`, error);
        require('fs').appendFileSync('cmd_error.log', `[${new Date().toISOString()}] Error in /${interaction.commandName}:\n${error.stack}\n\n`);
        const msg = { content: '❌ An error occurred while executing this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg).catch(console.error);
        } else {
            await interaction.reply(msg).catch(console.error);
        }
    }
});

// ── Prefix Command Handler ────────────────────────────────
const DEFAULT_PREFIX = process.env.BOT_PREFIX || '!';
const { loadPrefixes } = require('./commands/prefix');

function getPrefix(guildId) {
    try {
        const prefixes = loadPrefixes();
        return prefixes[guildId] || DEFAULT_PREFIX;
    } catch {
        return DEFAULT_PREFIX;
    }
}

client.on(Events.MessageCreate, async (message) => {
    // Ignore bots, DMs
    if (message.author.bot || !message.guild) return;

    const prefix = getPrefix(message.guildId);
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = message.client.commands.get(commandName);
    if (!command) return; // Not a valid command, silently ignore

    // Create adapter that makes the message look like a slash interaction
    const adapter = new MessageAdapter(message, commandName, args, command.data);

    try {
        await command.execute(adapter);

        // ── Command Usage Logger (prefix) ──
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (logChannelId) {
            try {
                const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
                if (logChannel) {
                    const argStr = adapter.options.data.map(o => `\`${o.name}:\` ${o.value}`).join('\n') || 'None';
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xEB459E)
                        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                        .setTitle(`🔧 ${prefix}${commandName}`)
                        .addFields(
                            { name: '👤 User', value: `<@${message.author.id}>`, inline: true },
                            { name: '📁 Server', value: message.guild?.name || 'DM', inline: true },
                            { name: '💬 Channel', value: `<#${message.channelId}>`, inline: true },
                            { name: '📝 Options', value: argStr }
                        )
                        .setFooter({ text: `User ID: ${message.author.id} • Prefix Command` })
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            } catch {}
        }
    } catch (error) {
        console.error(`Error in ${prefix}${commandName}:`, error);
        require('fs').appendFileSync('cmd_error.log', `[${new Date().toISOString()}] Error in ${prefix}${commandName}:\n${error.stack}\n\n`);
        message.reply('❌ An error occurred while executing this command.').catch(() => {});
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (!message.guild && !message.author.bot) {
        console.log(`  📩 [DEBUG] DM received from ${message.author.tag}: "${message.content?.substring(0, 50)}"`);
        const dmLogId = process.env.DM_LOG_CHANNEL_ID;
        if (!dmLogId) { console.log('  📩 [DEBUG] No DM_LOG_CHANNEL_ID set'); return; }
        try {
            const logChannel = await client.channels.fetch(dmLogId).catch(() => null);
            if (!logChannel) { console.log(`  📩 [DEBUG] Could not fetch channel ${dmLogId}`); return; }

            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTitle('📩 New DM Received')
                .setDescription(message.content || '*No text content*')
                .setFooter({ text: `User ID: ${message.author.id}` })
                .setTimestamp();

            if (message.attachments.size > 0) {
                const files = message.attachments.map(a => `[📎 ${a.name}](${a.url})`).join('\n');
                embed.addFields({ name: '📎 Attachments', value: files });
            }

            await logChannel.send({ embeds: [embed] });
            console.log('  📩 [DEBUG] DM log sent successfully');
        } catch (err) {
            console.error('  📩 [DEBUG] DM log error:', err.message);
        }
    }
});

// ── Snipe Cache (deleted messages) ────────────────────────
client.snipes = new Map();

client.on(Events.MessageDelete, (message) => {
    if (!message.guild || message.author?.bot) return;

    client.snipes.set(message.channelId, {
        content: message.content,
        author: message.author,
        attachmentURL: message.attachments.first()?.url || null,
        channelName: message.channel.name,
        deletedAt: new Date(),
    });

    // Auto-clear after 5 minutes
    setTimeout(() => {
        const cached = client.snipes.get(message.channelId);
        if (cached && cached.deletedAt.getTime() === new Date().getTime() - 300_000) {
            client.snipes.delete(message.channelId);
        }
    }, 300_000);
});

// ── Sticky Nickname Enforcement ────────────────────────────
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.nickname === newMember.nickname) return;

    // Dynamically get the stickyNicks map from the loaded command
    const setnickCmd = client.commands.get('setnick');
    if (!setnickCmd || !setnickCmd.stickyNicks) return;

    const guildStickies = setnickCmd.stickyNicks.get(newMember.guild.id);
    if (!guildStickies) return;

    const stickyNick = guildStickies.get(newMember.id);
    if (!stickyNick) return;

    // If the nickname was changed to something other than the sticky nick, revert it
    if (newMember.nickname !== stickyNick) {
        try {
            await newMember.setNickname(stickyNick, 'Sticky nickname enforced');
            console.log(`  📌 [STICKY] Reverted ${newMember.user.tag}'s nick back to "${stickyNick}"`);
        } catch (err) {
            console.error(`  ⚠️ [STICKY] Failed to enforce nick for ${newMember.user.tag}:`, err.message);
        }
    }
});

// ── Ready ──────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🤖 Bot: ${c.user.tag}`);
    console.log(`  📡 Servers: ${c.guilds.cache.size}`);
    console.log(`  📝 Commands: ${c.commands.size}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Start YouTube Live stream monitor
    startYouTubeLiveMonitor(c);
});

// ── Global Error Handling ────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
    console.error('  ⚠️  [Unhandled Rejection]', promise, 'reason:', reason);
    process.exit(1); // Force exit so Render restarts it and logs the error
});
process.on('uncaughtException', (err) => {
    console.error('  ⚠️  [Uncaught Exception]', err);
    process.exit(1); // Force exit so Render restarts it and logs the error
});

// Start the Bot
if (!process.env.DISCORD_TOKEN) {
    console.error('\n❌ FATAL ERROR: DISCORD_TOKEN environment variable is missing!');
    console.error('Please check your Render dashboard -> Environment tab.\n');
    process.exit(1);
}

console.log(`  🔑 Token found (length: ${process.env.DISCORD_TOKEN.length})`);
client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('\n❌ FATAL ERROR: Failed to login to Discord:', err.message);
    process.exit(1);
});

module.exports = { client };
