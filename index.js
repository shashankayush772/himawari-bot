require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const { QueueManager } = require('./utils/queue');
const { MessageAdapter } = require('./utils/message-adapter');
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

// ── Lavalink (Shoukaku) ────────────────────────────────────
// Use external free Lavalink nodes (no need to self-host Java)
const lavalinkNodes = [];

// Primary: env-configured node (can be external or local)
if (process.env.LAVALINK_HOST) {
    lavalinkNodes.push({
        name: process.env.LAVALINK_NAME || 'Primary',
        url: process.env.LAVALINK_HOST,
        auth: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
        secure: process.env.LAVALINK_SECURE === 'true',
    });
}

// Fallback free public nodes
const fallbackNodes = [
    { name: 'Jirayu',     url: 'lavalink.jirayu.net:443',       auth: 'youshallnotpass', secure: true },
    { name: 'KasawaPro',  url: 'lava.kasawa.pro:2333',          auth: 'youshallnotpass', secure: false },
];

for (const fb of fallbackNodes) {
    if (!lavalinkNodes.some(n => n.url === fb.url)) {
        lavalinkNodes.push(fb);
    }
}

console.log(`  🎵 Configured ${lavalinkNodes.length} Lavalink node(s):`, lavalinkNodes.map(n => n.name).join(', '));

client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), lavalinkNodes, {
    moveOnDisconnect: false,
    reconnectTries: 15,
    reconnectInterval: 5000,
});

client.shoukaku.on('ready', (name) => console.log(`  🎵 Lavalink node "${name}" connected`));
client.shoukaku.on('error', (name, error) => console.error(`  ❌ Lavalink "${name}" error:`, error.message));
client.shoukaku.on('close', (name, code, reason) => console.warn(`  ⚠️  Lavalink "${name}" closed [${code}]: ${reason || 'no reason'}`));
client.shoukaku.on('disconnect', (name, players, moved) => {
    console.warn(`  ⚠️  Lavalink "${name}" disconnected. Players affected: ${players.size}. Moved: ${moved}`);
});

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

// ── Ready ──────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🤖 Bot: ${c.user.tag}`);
    console.log(`  📡 Servers: ${c.guilds.cache.size}`);
    console.log(`  📝 Commands: ${c.commands.size}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// ── Global Error Handling ────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
    console.error('  ⚠️  [Unhandled Rejection]', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('  ⚠️  [Uncaught Exception]', err);
});

// Start the Bot
client.login(process.env.DISCORD_TOKEN);
