#!/bin/bash
set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Himawari Bot — Render Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── NOTE: Lavalink is now external (no Java needed) ──
echo "  🎵 Using external Lavalink nodes (no local Java required)"
echo ""

# ── Step 1: Deploy slash commands ──
echo "  📦 Deploying slash commands..."
node deploy-commands.js || echo "  ⚠️  Deploy warning (non-fatal)"
sleep 2

# ── Step 2: Start a tiny HTTP health-check server (Render requirement) ──
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

# ── Step 3: Start the bot ──
echo ""
echo "  🤖 Starting Himawari bot..."
echo ""
exec node index.js
