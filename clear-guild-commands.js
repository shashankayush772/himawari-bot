require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Clearing guild-scoped commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: [] }
        );
        console.log('✅ Guild commands cleared! Duplicates should disappear now.');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit(0);
})();
