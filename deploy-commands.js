require('dotenv').config();
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); // Fix IPv6 hanging

// Fix Discord.js v14 (undici) IPv6 hanging
const { Agent, setGlobalDispatcher } = require('undici');
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`  📦 Queued: /${command.data.name}`);
    } else {
        console.log(`  ⚠️  Skipped ${file}: missing "data" property.`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Use --guild flag for instant guild-only sync (testing)
// Use without flag for global deployment (all servers)
const guildOnly = process.argv.includes('--guild');

(async () => {
    try {
        if (guildOnly) {
            console.log(`\n🔄 Syncing ${commands.length} commands to guild ${process.env.GUILD_ID} (instant)...\n`);
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`✅ Guild sync complete — ${data.length} commands!\n`);
        } else {
            console.log(`\n🌐 Deploying ${commands.length} commands GLOBALLY (all servers)...\n`);
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`✅ Global deploy complete — ${data.length} commands!`);
            console.log(`⏳ Note: Global commands can take up to 1 hour to appear everywhere.\n`);
        }
    } catch (error) {
        console.error('❌ Failed to sync commands:', error);
    }
})();
