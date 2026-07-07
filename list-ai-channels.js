require('dotenv').config();
const { MongoClient } = require('mongodb');
const { Client, GatewayIntentBits } = require('discord.js');

async function getChannels() {
    console.log("Connecting to MongoDB...");
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('himawari');
    const aiCollection = db.collection('ai_channels');
    const docs = await aiCollection.find({}).toArray();
    
    if (docs.length === 0) {
        console.log("No AI channels are currently active.");
        await client.close();
        return;
    }

    console.log("Connecting to Discord to fetch channel names...");
    const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
    
    discordClient.once('ready', async () => {
        console.log("\n🔥 Active AI Channels:");
        console.log("------------------------");
        
        for (const doc of docs) {
            try {
                const channel = await discordClient.channels.fetch(doc.channelId);
                console.log(`- #${channel.name} (in server: ${channel.guild.name}) [ID: ${doc.channelId}]`);
            } catch (err) {
                console.log(`- Unknown Channel (Bot doesn't have access or it was deleted) [ID: ${doc.channelId}]`);
            }
        }
        
        console.log("------------------------");
        await client.close();
        discordClient.destroy();
        process.exit(0);
    });

    await discordClient.login(process.env.DISCORD_TOKEN);
}

getChannels().catch(console.error);
