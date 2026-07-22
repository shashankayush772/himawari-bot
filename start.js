const { spawn } = require('child_process');

(async () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🚀 Himawari Bot Launcher');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');


    // Step 1: Deploy commands
    console.log('  📦 Deploying commands...');
    try {
        require('./deploy-commands.js');
        // Give deploy a moment to finish
        await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
        console.error('  ⚠️  Deploy error:', err.message);
    }

    // Step 2: Start the bot
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
