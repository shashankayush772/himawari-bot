const { FFmpeg } = require('@discord-player/ffmpeg');

// Monkey-patch FFmpeg.spawn to capture stderr
const originalSpawn = FFmpeg.spawn;
FFmpeg.spawn = function (options) {
    const process = originalSpawn.call(this, options);
    
    if (process.stderr) {
        process.stderr.on('data', (data) => {
            console.error(`[FFMPEG STDERR] ${data.toString().trim()}`);
        });
    }
    
    process.on('exit', (code, signal) => {
        console.log(`[FFMPEG EXIT] Code: ${code}, Signal: ${signal}`);
    });
    
    return process;
};

console.log('✅ Injected FFmpeg stderr logger');
