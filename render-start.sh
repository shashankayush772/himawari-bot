#!/bin/bash
set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Himawari Bot — Render Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🎵 Using external Lavalink nodes (no local Java needed)"
echo ""

# ── Step 1: Start a tiny HTTP health-check server (Render requirement) ──
echo "  🌐 Starting health-check server on port ${PORT:-10000}..."
node -e "
const http = require('http');
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({ status: 'ok', bot: 'himawari', uptime: process.uptime() }));
}).listen(port, '0.0.0.0', () => console.log('  ✅ Health-check listening on port ' + port));
" &

# ── Step 2: Deploy slash commands ──
echo "  📦 Deploying slash commands..."
# Run in background with timeout to avoid blocking the bot from starting
timeout 30 node deploy-commands.js &
sleep 2

# ── Step 3: Start the bot ──
echo ""
echo "  🤖 Starting Himawari bot..."
echo ""
exec node index.js
