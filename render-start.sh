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

# Wait for Lavalink to be ready (up to 45 seconds)
echo "  ⏳ Waiting for Lavalink to start..."
for i in $(seq 1 45); do
    if nc -z 127.0.0.1 2333 2>/dev/null; then
        echo "  ✅ Lavalink is ready!"
        break
    fi
    if [ $i -eq 45 ]; then
        echo "  ⚠️  Lavalink may not have started. Bot will retry connecting."
    fi
    if [ $((i % 10)) -eq 0 ]; then
        echo "  ⏳ Still waiting... (${i}s)"
    fi
    sleep 1
done

echo ""

# ── Step 2: Deploy slash commands ──
echo "  📦 Deploying slash commands..."
node deploy-commands.js || echo "  ⚠️  Deploy warning (non-fatal)"
sleep 2

# ── Step 3: Start a tiny HTTP health-check server (Render requirement) ──
# Render Web Services need an HTTP endpoint to stay alive
echo "  🌐 Starting health-check server on port ${PORT:-10000}..."
node -e "
const http = require('http');
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({ status: 'ok', bot: 'himawari', uptime: process.uptime() }));
}).listen(port, () => console.log('  ✅ Health-check listening on port ' + port));
" &

# ── Step 4: Start the bot ──
echo ""
echo "  🤖 Starting Himawari bot..."
echo ""
exec node index.js
