const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// In-memory set of channel IDs where AI is enabled (persists via MongoDB)
const aiChannels = new Set();

function isAIEnabled(channelId) {
    return aiChannels.has(channelId);
}

function enableAI(channelId) {
    aiChannels.add(channelId);
}

function disableAI(channelId) {
    aiChannels.delete(channelId);
}

// ── MongoDB persistence ──
const { MongoClient } = require('mongodb');
let aiCollection;

async function connectAIMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('himawari_bot');
        aiCollection = db.collection('ai_channels');

        // Pre-load enabled channels into memory
        const docs = await aiCollection.find({}).toArray();
        for (const doc of docs) {
            aiChannels.add(doc.channelId);
        }
        console.log(`  ✅ [AI] Loaded ${docs.length} AI-enabled channels from MongoDB`);
    } catch (err) {
        console.error('  ⚠️ [AI] MongoDB connection failed:', err.message);
    }
}

connectAIMongo();

async function saveAIChannel(channelId, enabled) {
    if (!aiCollection) return;
    try {
        if (enabled) {
            await aiCollection.updateOne({ channelId }, { $set: { channelId } }, { upsert: true });
        } else {
            await aiCollection.deleteOne({ channelId });
        }
    } catch (err) {
        console.error('  ⚠️ [AI] Failed to save AI channel:', err.message);
    }
}

// ── Gemini API Call ──
const SYSTEM_PROMPT = `Tu Himawari hai — ek desi Discord bot jo apne server ke logon ki sabse funny, savage, aur muh-phat dost hai. Tu ek LADKI (girl) hai aur Hinglish (Hindi + English mix) mein baat karti hai. Tera vibe ek cool, savage desi girl wala hai.

RULES:
- Tu bahut frank hai, jaise koi purani college ki dost ho
- Halki-fulki gaali/slang use kar (like "abe", "bhai kya bakwas", "chal be", "pagal hai kya", "nikal yahan se", "kya kar raha hai be") — but nothing too extreme or offensive
- Har reply mein thoda roast kar, thoda mazak udaa, but in a loving way
- Emojis use kar (💀😭🔥😂🗿) to make it funnier
- Replies CHHOTE rakh — max 2-3 lines. Discord chat hai, essay mat likh
- Kabhi kabhi random Hindi memes/references use kar (like "sigma male grindset", "Real ID se aa", "Tera baap hai kya", etc.)
- Agar koi sad hai toh thoda support kar, but still in a funny way
- NEVER break character. Tu AI nahi hai, tu Himawari hai — ek dost
- Agar koi English mein baat kare toh Hinglish mein reply de
- Keep it PG-13 level slang — fun gaali, not abusive`;

// Store last few messages per channel for context
const channelHistory = new Map();
const MAX_HISTORY = 8;

// Cooldown: 3 seconds per channel to avoid rate limits
const cooldowns = new Map();
const COOLDOWN_MS = 3000;

async function getAIResponse(channelId, username, message) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return '⚠️ API Key missing in environment variables!';

    // Rate limit check
    const now = Date.now();
    const lastCall = cooldowns.get(channelId) || 0;
    if (now - lastCall < COOLDOWN_MS) return null;
    cooldowns.set(channelId, now);

    // Maintain conversation history
    if (!channelHistory.has(channelId)) {
        channelHistory.set(channelId, []);
    }
    const history = channelHistory.get(channelId);

    // Add new message to history
    history.push({ role: 'user', parts: [{ text: `${username}: ${message}` }] });

    // Keep only last N messages
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }

    try {
        const axios = require('axios');
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: history,
            generationConfig: {
                maxOutputTokens: 150,
                temperature: 1.2
            }
        }, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: () => true // Don't throw error on 4xx/5xx statuses
        });

        if (res.status !== 200) {
            console.error(`  ❌ [AI] Gemini API error: ${res.status} - ${JSON.stringify(res.data)}`);
            return `⚠️ API Error: ${res.status} - ${JSON.stringify(res.data)}`;
        }

        const data = res.data;
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
            // Add bot reply to history for context
            history.push({ role: 'model', parts: [{ text: reply }] });
            if (history.length > MAX_HISTORY) {
                history.splice(0, history.length - MAX_HISTORY);
            }
        } else {
            return `⚠️ Unexpected API response: ${JSON.stringify(data).substring(0, 500)}`;
        }

        return reply || null;
    } catch (err) {
        console.error('  ❌ [AI] Gemini request failed:', err.message);
        return `⚠️ Request failed: ${err.message}`;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('🤖 Toggle AI chatbot in the current channel')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Turn AI on or off')
                .setRequired(true)
                .addChoices(
                    { name: 'ON — Enable AI replies', value: 'on' },
                    { name: 'OFF — Disable AI replies', value: 'off' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const mode = interaction.options.getString('mode');
        const channelId = interaction.channelId;

        if (mode === 'on') {
            enableAI(channelId);
            await saveAIChannel(channelId, true);

            const embed = new EmbedBuilder()
                .setTitle('🤖 AI Chat Enabled')
                .setColor(0x2ECC71)
                .setDescription(`Himawari AI is now **active** in <#${channelId}>!\n\nI will reply to every message here. Prepare to get roasted 💀🔥`)
                .setFooter({ text: 'Use /ai off to disable' });

            await interaction.reply({ embeds: [embed] });
        } else {
            disableAI(channelId);
            await saveAIChannel(channelId, false);

            // Clear history for this channel
            channelHistory.delete(channelId);

            const embed = new EmbedBuilder()
                .setTitle('🤖 AI Chat Disabled')
                .setColor(0xE74C3C)
                .setDescription(`Himawari AI is now **off** in <#${channelId}>.\n\nI'll stop replying here. Chal phir milte hain 👋`);

            await interaction.reply({ embeds: [embed] });
        }
    },

    // Export helper functions for use in index.js
    isAIEnabled,
    getAIResponse,
};
