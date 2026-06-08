#!/bin/bash
set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Himawari Bot — Render Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Step 1: Start Lavalink in the background ──
echo "  🎵 Starting Lavalink server..."
cd /app/lavalink
java -Xmx256m -Xms128m \
     -XX:+UseG1GC \
     -XX:+ParallelRefProcEnabled \
     -jar Lavalink.jar &
LAVALINK_PID=$!
cd /app

# Wait for Lavalink to be FULLY ready (up to 120 seconds for slow containers)
echo "  ⏳ Waiting for Lavalink to start..."
READY=false
for i in $(seq 1 120); do
    if nc -z 127.0.0.1 2333 2>/dev/null; then
        # Port is open, but wait a few more seconds for full initialization
        echo "  🔄 Port 2333 open, waiting for full initialization..."
        sleep 5
        READY=true
        break
    fi
    if [ $((i % 15)) -eq 0 ]; then
        echo "  ⏳ Still waiting... (${i}s)"
    fi
    sleep 1
done

if [ "$READY" = true ]; then
    echo "  ✅ Lavalink is ready!"
else
    echo "  ⚠️  Lavalink may not have started. Bot will retry connecting."
fi

echo ""

# ── Step 2: Deploy slash commands ──
echo "  📦 Deploying slash commands..."
node deploy-commands.js || echo "  ⚠️  Deploy warning (non-fatal)"
sleep 2

# ── Step 3: Start a tiny HTTP health-check server (Render requirement) ──
echo "  🌐 Starting health-check server on port ${PORT:-10000}..."
node -e "
const http = require('http');
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({ status: 'ok', bot: 'himawari', uptime: process.uptime() }));
}).listen(port, '0.0.0.0', () => console.log('  ✅ Health-check listening on port ' + port));
" &

# ── Step 4: Start the bot ──
echo ""
echo "  🤖 Starting Himawari bot..."
echo ""
exec node index.js
