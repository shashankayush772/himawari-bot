require('dotenv').config();
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); // Fix Node.js native modules IPv6 hanging

console.log('\n  🔍 [NETWORK TEST] Testing direct connection to Discord API...');
fetch('https://discord.com/api/v10/gateway/bot', {
    headers: { 'Authorization': `Bot ${process.env.DISCORD_TOKEN}` }
}).then(async res => {
    console.log(`  ✅ [NETWORK TEST] Connected! Status: ${res.status} ${res.statusText}`);
    if (!res.ok) {
        console.error(`  ❌ [NETWORK TEST] Discord rejected the connection. Response:`, await res.text());
        process.exit(1);
    }
}).catch(err => {
    console.error(`  ❌ [NETWORK TEST] Connection completely failed/hung:`, err.message);
    process.exit(1);
});

const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MessageAdapter } = require('./utils/message-adapter');
const { startYouTubeLiveMonitor } = require('./utils/yt-live-monitor');
const { getHoneypotChannel, incrementStats, getStats, updateGlobalServerCount } = require('./utils/honeypot-db');
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
    // ── Honeypot Statistics Popup ──
    if (interaction.isButton() && interaction.customId === 'honeypot_stats_btn') {
        try {
            // Update the global server count just to keep it fresh
            await updateGlobalServerCount(client.guilds.cache.size);
            const stats = await getStats(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('🍯 Honeypot Statistics 🍯')
                .setColor(0x2B2D31)
                .addFields(
                    { name: 'Server Stats:', value: `Total moderated in this server: \`${stats.serverKicks}\`` },
                    { name: 'Global Stats:', value: `Total servers: \`${stats.totalServers.toLocaleString()}\`\nTotal moderations: \`${stats.globalKicks.toLocaleString()}\`` }
                )
                .setFooter({ text: 'Thank you for using Himawari to keep your servers safe from unwanted bots!' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
                    .setEmoji('🍯'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/your-support-invite') // REPLACE THIS IN THE FUTURE
                    .setEmoji('💬'),
                new ButtonBuilder()
                    .setLabel('Live Stats')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://top.gg') // REPLACE THIS IN THE FUTURE
                    .setEmoji('📊')
            );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        } catch (err) {
            console.error('Honeypot button error:', err);
            await interaction.reply({ content: '❌ Could not load statistics right now.', ephemeral: true }).catch(() => {});
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
    // ── Honeypot Trap Logic ──
    if (message.guild && !message.author.bot) {
        const trapChannelId = getHoneypotChannel(message.guild.id);
        if (trapChannelId && message.channel.id === trapChannelId) {
            // INSTANT BAN!
            try {
                await message.delete();
                await message.guild.members.ban(message.author.id, { reason: 'Typed in Honeypot channel (Automated Raid Defense)' });
                
                await incrementStats(message.guild.id);
                const stats = await getStats(message.guild.id);

                // Try to update the button on the sticky message
                const messages = await message.channel.messages.fetch({ limit: 10 });
                const stickyMsg = messages.find(m => m.author.id === client.user.id && m.components.length > 0);
                
                if (stickyMsg) {
                    const oldRow = stickyMsg.components[0];
                    const newRow = ActionRowBuilder.from(oldRow);
                    newRow.components[0].setLabel(`Kicks: ${stats.serverKicks}`);
                    await stickyMsg.edit({ components: [newRow] }).catch(() => {});
                }
            } catch (err) {
                console.error(`  ⚠️ [HONEYPOT] Failed to ban ${message.author.tag} in ${message.guild.id}:`, err.message);
            }
            return; // Stop processing this message further
        }
    }

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
