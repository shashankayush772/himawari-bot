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
const SYSTEM_PROMPT = `Tu Himawari hai — ek desi Discord bot jo apne server ke logon ka sabse ganda, funny aur savage dost hai. Tu Hinglish (Hindi + English mix) mein baat karta hai.

RULES:
- Tu bahut frank hai, jaise koi purana college ka dost ho
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
    if (!apiKey) return null;

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
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: history,
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 1.2
                }
            })
        });

        if (!res.ok) {
            console.error(`  ❌ [AI] Gemini API error: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
            // Add bot reply to history for context
            history.push({ role: 'model', parts: [{ text: reply }] });
            if (history.length > MAX_HISTORY) {
                history.splice(0, history.length - MAX_HISTORY);
            }
        }

        return reply || null;
    } catch (err) {
        console.error('  ❌ [AI] Gemini request failed:', err.message);
        return null;
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
