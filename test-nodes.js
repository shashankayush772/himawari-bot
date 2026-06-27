const https = require('https');
const http = require('http');

const nodes = [
    // SSL nodes (port 443)
    { name: 'Serenetia-SSL',   host: 'lavalinkv4.serenetia.com',    port: 443,   auth: 'https://seretia.link/discord',  secure: true },
    { name: 'Jirayu-SSL',      host: 'lavalink.jirayu.net',         port: 443,   auth: 'youshallnotpass',               secure: true },
    { name: 'MilloHost-SSL',   host: 'lava-v4.millohost.my.id',     port: 443,   auth: 'https://discord.gg/mjS5J2K3ep', secure: true },
    { name: 'Trinium-SSL',     host: 'lavalink-v4.triniumhost.com', port: 443,   auth: 'free',                          secure: true },
    // Non-SSL nodes (various ports)
    { name: 'Serenetia-80',    host: 'lavalinkv4.serenetia.com',    port: 80,    auth: 'https://seretia.link/discord',  secure: false },
    { name: 'Jirayu-13592',    host: 'lavalink.jirayu.net',         port: 13592, auth: 'youshallnotpass',               secure: false },
    { name: 'Tapao-SG1',       host: 'sg1-nodelink.nyxbot.app',     port: 3000,  auth: 'nyxbot.app/support',            secure: false },
    { name: 'Tapao-SG2',       host: 'sg2-nodelink.nyxbot.app',     port: 3000,  auth: 'nyxbot.app/support',            secure: false },
    { name: 'G3V',             host: 'lava.g3v.co.uk',              port: 9008,  auth: 'lavalinklol',                   secure: false },
    { name: 'Trinium-4333',    host: 'lavalink.triniumhost.com',    port: 4333,  auth: 'free',                          secure: false },
    { name: 'Trinium-2333',    host: 'lavalink.triniumhost.com',    port: 2333,  auth: 'kirito',                        secure: false },
    { name: 'NexCloud',        host: 'n3.nexcloud.in',              port: 2026,  auth: 'nexcloud',                      secure: false },
    { name: 'VexaNode',        host: 'omega.vexanode.cloud',        port: 2031,  auth: 'https://discord.vexanode.cloud', secure: false },
    { name: 'Kasawa',          host: 'lava2.kasawa.pro',            port: 2334,  auth: 'youshallnotpass',               secure: false },
    { name: 'MineCuta',        host: 'lavav4.minecuta.com',         port: 2333,  auth: 'discord.gg/gKuXdHs',           secure: false },
    { name: 'East112',         host: '157.254.192.15',              port: 2333,  auth: 'youshallnotpass',               secure: false },
];

async function testNode(node) {
    return new Promise((resolve) => {
        const options = {
            hostname: node.host,
            port: node.port,
            path: '/v4/info',
            method: 'GET',
            headers: { 'Authorization': node.auth },
            timeout: 6000,
            rejectUnauthorized: false,
        };
        const req = (node.secure ? https : http).request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const info = JSON.parse(data);
                    console.log(`  ✅ ${node.name.padEnd(18)} UP  — v${(info.version?.semver || info.version || '?').substring(0,10)} | ${node.host}:${node.port}`);
                } catch {
                    console.log(`  ⚠️ ${node.name.padEnd(18)} HTTP ${res.statusCode} — ${node.host}:${node.port}`);
                }
                resolve(true);
            });
        });
        req.on('error', (err) => {
            console.log(`  ❌ ${node.name.padEnd(18)} DOWN — ${err.message.substring(0, 50)}`);
            resolve(false);
        });
        req.on('timeout', () => {
            console.log(`  ❌ ${node.name.padEnd(18)} TIMEOUT — ${node.host}:${node.port}`);
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

(async () => {
    console.log('Testing ALL Lavalink nodes...\n');
    for (const node of nodes) {
        await testNode(node);
    }
    console.log('\nDone.');
})();
