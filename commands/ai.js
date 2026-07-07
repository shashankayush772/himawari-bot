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

const messageQueues = new Map();

const OWNER_ID = '814328153513525308'; // Ayushh <3

async function processQueue(channelId) {
    const queue = messageQueues.get(channelId);
    if (!queue || queue.length === 0) return;
    if (queue.isProcessing) return;

    queue.isProcessing = true;
    while (queue.length > 0) {
        const { username, message, userId, resolve } = queue.shift();
        try {
            const reply = await fetchAIResponse(channelId, username, message, userId);
            resolve(reply);
        } catch (err) {
            resolve(null);
        }
        // Wait 4.1 seconds between API calls to strictly respect Google's 15 Requests Per Minute limit
        await new Promise(r => setTimeout(r, 4100));
    }
    queue.isProcessing = false;
}

async function getAIResponse(channelId, username, message, userId) {
    return new Promise((resolve) => {
        if (!messageQueues.has(channelId)) {
            const queue = [];
            queue.isProcessing = false;
            messageQueues.set(channelId, queue);
        }
        messageQueues.get(channelId).push({ username, message, userId, resolve });
        processQueue(channelId);
    });
}

async function fetchAIResponse(channelId, username, message, userId) {
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY; // fallback if they don't rename it
    if (!apiKey) return '⚠️ API Key missing in environment variables!';

    // Maintain conversation history
    if (!channelHistory.has(channelId)) {
        channelHistory.set(channelId, []);
    }

    const history = channelHistory.get(channelId);
    history.push({ role: 'user', parts: [{ text: `${username}: ${message}` }] });

    // Keep only last N messages (ensure it starts with 'user' role)
    if (history.length > MAX_HISTORY) {
        let spliceIndex = history.length - MAX_HISTORY;
        // Gemini API strictly requires the first message to be from 'user'
        if (history[spliceIndex].role === 'model') {
            spliceIndex += 1;
        }
        history.splice(0, spliceIndex);
    }

    let dynamicPrompt = SYSTEM_PROMPT;
    if (userId === OWNER_ID) {
        dynamicPrompt += `\n\nCRITICAL OVERRIDE FOR THIS MESSAGE:\nThe person currently speaking to you (username: ${username}) is YOUR CREATOR, BOSS, AND OWNER. You MUST treat him as your boss. Treat him in a cute, nakhrewali (playful/picky) way. You can pretend to be a little mad at him sometimes, but ultimately show deep respect and affection because he owns you!`;
    }

    try {
        const axios = require('axios');
        
        // Map Gemini history format to Groq/OpenAI format for the API request
        const groqMessages = [
            { role: 'system', content: dynamicPrompt }
        ];
        
        for (const msg of history) {
            groqMessages.push({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.parts[0].text
            });
        }

        const res = await axios.post(`https://api.groq.com/openai/v1/chat/completions`, {
            model: "llama3-70b-8192",
            messages: groqMessages,
            max_tokens: 150,
            temperature: 1.2
        }, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            validateStatus: () => true
        });

        if (res.status !== 200) {
            console.error(`  ❌ [AI] Groq API error: ${res.status} - ${JSON.stringify(res.data)}`);
            history.pop();
            return null;
        }

        const data = res.data;
        const reply = data?.choices?.[0]?.message?.content;

        if (!reply) {
            console.error(`  ❌ [AI] Groq returned no text.`);
            history.pop();
            return "*(I tried to reply, but my brain glitched!)* 😵";
        }

        // Add bot reply to history for context
        history.push({ role: 'model', parts: [{ text: reply }] });
        if (history.length > MAX_HISTORY) {
            let spliceIndex = history.length - MAX_HISTORY;
            if (history[spliceIndex].role === 'model') spliceIndex += 1;
            history.splice(0, spliceIndex);
        }

        return reply;
    } catch (err) {
        console.error('  ❌ [AI] Groq request failed:', err.message);
        history.pop(); // Remove user message on failure
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
