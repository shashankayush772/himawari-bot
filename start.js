const { spawn, execSync } = require('child_process');
const path = require('path');
const net = require('net');

const LAVALINK_PORT = 2333;
const LAVALINK_DIR = path.join(__dirname, 'lavalink');

function isPortOpen(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1500);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.connect(port, '127.0.0.1');
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

(async () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🚀 Himawari Bot Launcher');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Check if Lavalink is already running
    let lavalinkReady = await isPortOpen(LAVALINK_PORT);

    if (lavalinkReady) {
        console.log('  ✅ Lavalink is already running on port 2333');
    } else {
        console.log('  🎵 Starting Lavalink server...');

        // Find java
        let javaPath = 'java';
        try {
            execSync('java -version', { stdio: 'ignore' });
        } catch {
            // Try common paths
            const paths = [
                'C:\\Program Files\\Java\\jdk-24\\bin\\java.exe',
                'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
                'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.6.7-hotspot\\bin\\java.exe',
            ];
            for (const p of paths) {
                try {
                    execSync(`"${p}" -version`, { stdio: 'ignore' });
                    javaPath = p;
                    break;
                } catch {}
            }
        }

        const lavalink = spawn(javaPath, [
            '-Xmx512m', '-Xms256m',
            '-XX:+UseG1GC',
            '-XX:+ParallelRefProcEnabled',
            '-jar', 'Lavalink.jar'
        ], {
            cwd: LAVALINK_DIR,
            stdio: 'ignore',
            detached: true,
            windowsHide: true,
        });
        lavalink.unref();

        // Wait for Lavalink to be ready (up to 30 seconds)
        console.log('  ⏳ Waiting for Lavalink to start...');
        for (let i = 0; i < 30; i++) {
            await sleep(1000);
            lavalinkReady = await isPortOpen(LAVALINK_PORT);
            if (lavalinkReady) break;
            if (i % 5 === 4) console.log(`  ⏳ Still waiting... (${i + 1}s)`);
        }

        if (lavalinkReady) {
            console.log('  ✅ Lavalink is ready!\n');
        } else {
            console.log('  ⚠️  Lavalink may not have started. Bot will retry connecting.\n');
        }
    }

    // Step 2: Deploy commands
    console.log('  📦 Deploying commands...');
    try {
        require('./deploy-commands.js');
        // Give deploy a moment to finish
        await sleep(3000);
    } catch (err) {
        console.error('  ⚠️  Deploy error:', err.message);
    }

    // Step 3: Start the bot
    console.log('\n  🤖 Starting bot...\n');
    const bot = spawn('node', ['index.js'], {
        cwd: __dirname,
        stdio: 'inherit',
    });

    bot.on('exit', (code) => {
        console.log(`\n  Bot exited with code ${code}`);
        process.exit(code);
    });
})();
