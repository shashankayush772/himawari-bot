<div align="center">
  
# 🌻 Himawari Bot

**A feature-rich, multi-purpose Discord bot built with Discord.js and Shoukaku.**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg?style=for-the-badge&logo=discord)](https://discord.js.org/)
[![Shoukaku](https://img.shields.io/badge/Shoukaku-Lavalink-orange.svg?style=for-the-badge)](https://github.com/Deivu/Shoukaku)
[![Hosted on Render](https://img.shields.io/badge/Hosted_on-Render-black.svg?style=for-the-badge&logo=render)](https://render.com/)

---
</div>

## ✨ Features

Himawari comes packed with over **70+ commands** across various categories:

🎵 **Music System**
* High-quality audio playback using Lavalink & Shoukaku
* Features: `play`, `pause`, `resume`, `stop`, `skip`, `music-queue`, `nowplaying`, `volume`, `loop`, `shuffle`, `247`
* External Lavalink node support for zero-OOM hosting

🛡️ **Moderation**
* Keep your server safe with powerful moderation tools
* Features: `ban`, `unban`, `unbanall`, `kick`, `clear`, `nuke`, `slowmode`, `roleadd`, `roledel`

🛠️ **Utility & Info**
* Essential tools for server management and information
* Features: `serverinfo`, `userinfo`, `channelinfo`, `roleinfo`, `botinfo`, `ping`, `uptime`, `weather`, `translate`, `calculate`, `wikipedia`

🎉 **Fun & Roleplay**
* Keep your community engaged
* Features: `8ball`, `coinflip`, `meme`, `hug`, `kiss`, `punch`, `wink`, `facepalm`, `asmr`

---

## 🚀 Deployment (Render)

This bot is optimized for deployment on [Render](https://render.com/) using the free tier.

### 1. Prerequisites
* Node.js v20+
* A Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Environment Variables (`.env`)
Create a `.env` file in the root directory (or add these to your Render environment settings):

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id
GUILD_ID=your_primary_guild_id

# Channels
BUG_REPORT_CHANNEL_ID=channel_id
SUGGESTION_CHANNEL_ID=channel_id
LOG_CHANNEL_ID=channel_id
DM_LOG_CHANNEL_ID=channel_id

# Bot Prefix (Fallback for text commands)
BOT_PREFIX=!

# Lavalink Configuration (External Nodes)
LAVALINK_HOST=lavalink.jirayu.net:443
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_NAME=Jirayu-Primary
LAVALINK_SECURE=true
```

### 3. Running Locally
```bash
# Install dependencies
npm install

# Start the bot
node start.js
```

### 4. Deploying to Render
1. Connect this repository to your Render account.
2. Create a new **Web Service**.
3. Render will automatically use the provided `Dockerfile` and `render.yaml`.
4. Ensure you add all the Environment Variables from the `.env` section to the Render Dashboard.
5. Deploy!

---

## 🛠️ Architecture

* **Framework:** [Discord.js v14](https://discord.js.org/)
* **Music Wrapper:** [Shoukaku](https://github.com/Deivu/Shoukaku)
* **Audio Server:** External [Lavalink](https://github.com/lavalink-devs/Lavalink) nodes (configured for failover)
* **Hosting:** Dockerized for Render Web Services

---

<div align="center">
  <i>Made with 💛 for Discord Communities</i>
</div>
