const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');
async function test() {
    const uri = 'mongodb+srv://himawari:c8VnLkKI3solJE4q@cluster0.tclcefw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(uri);
    console.log('Connecting...');
    await client.connect();
    console.log('✅ Connected!');
    const db = client.db('himawari');
    const col = db.collection('ytnotify');
    const doc = await col.findOne({ _id: 'ytnotify_data' });
    if (doc) {
        const guilds = doc.guilds || {};
        let totalTracks = 0;
        for (const [guildId, config] of Object.entries(guilds)) {
            const tracks = config.tracks || [];
            totalTracks += tracks.length;
            console.log(`\nServer ${guildId}: ${tracks.length} channel(s)`);
            for (const t of tracks) {
                console.log(`  - ${t.channelName} → #${t.discordChannelId}`);
            }
            if (config.customMessage) {
                console.log(`  Custom message: "${config.customMessage}"`);
            }
        }
        console.log(`\nTotal: ${totalTracks} channel(s) across ${Object.keys(guilds).length} server(s)`);
    } else {
        console.log('No data saved yet (empty database)');
    }
    await client.close();
}
test().catch(e => console.error('❌ Error:', e.message));
