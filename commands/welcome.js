const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const WELCOME_URL = 'https://www.youtube.com/watch?v=8EuU7wlb0Tw';

const welcomeMessages = [
    "🎺 **ATTENTION EVERYONE!** A literal legend just graced this VC with their presence. Act natural.",
    "🚨 **BREAKING NEWS:** Someone cool just joined. I repeat — someone COOL just joined the VC.",
    "👑 **Make way, peasants!** Royalty has entered the voice channel. Bow down or at least unmute.",
    "🎉 **THE PROPHECY IS FULFILLED!** The chosen one has arrived in the VC. The vibes are immaculate now.",
    "🌟 **Plot twist:** The main character just joined the VC. Everyone else is now a side quest.",
    "🔥 **SHEEEESH!** The VC just went from 0 to 100 real quick. Welcome, absolute unit.",
    "🎵 **DJ, drop the beat!** A VIP just walked through the velvet rope into this VC. No autographs please.",
    "🦅 **An eagle has landed.** The VC energy just went through the roof. Welcome, legend.",
    "💎 **Rare spawn detected!** A legendary player has entered the voice channel. Catch rate: 0%.",
    "🏆 **Ladies and gentlemen...** The person your parents warned you about just joined. Welcome, menace.",
    "🎪 **Step right up!** The circus was missing its ringmaster, but they're HERE now. Let the show begin!",
    "⚡ **THUNDER JUST STRUCK THE VC!** Oh wait, it's just someone absolutely electric joining. Welcome!",
    "🍿 **Grab your popcorn!** The entertainment has arrived. This VC is about to get INTERESTING.",
    "🛸 **UFO SIGHTING!** An unidentified FIRE person just landed in this VC. NASA is jealous.",
    "🎤 **MIC CHECK, MIC CHECK.** We have a certified legend in the building. I mean... the VC.",
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('🎉 Welcome everyone in the VC with style and a banger entrance song'),

    async execute(interaction) {
        const voice = interaction.member?.voice?.channel;
        if (!voice) return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });

        try {
            await interaction.deferReply();
        } catch { return; }

        const player = interaction.client.player;

        let result;
        try {
            result = await player.search(WELCOME_URL, {
                requestedBy: interaction.user,
            });
        } catch (err) {
            console.error('  ❌ Welcome search error:', err.message);
            return interaction.editReply('❌ Failed to search for the welcome track.');
        }

        if (!result || !result.hasTracks()) {
            return interaction.editReply('❌ Could not load the welcome track.');
        }

        try {
            const existingQueue = player.queues.get(interaction.guildId);
            const is247 = existingQueue?.metadata?.is247 || false;

            const { track, queue } = await player.play(voice, result, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        is247: is247,
                    },
                    volume: 80,
                    leaveOnEmpty: !is247,
                    leaveOnEmptyCooldown: 300_000,
                    leaveOnEnd: !is247,
                    leaveOnEndCooldown: 300_000,
                    selfDeaf: true,
                },
            });

            // Pick a random welcome message
            const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

            // List members in the VC
            const vcMembers = voice.members
                .filter(m => !m.user.bot)
                .map(m => `> 🎤 <@${m.id}>`)
                .join('\n') || '> *Empty VC... awkward.*';

            const embed = new EmbedBuilder()
                .setColor(0xF1C40F)
                .setTitle('🎉 WELCOME TO THE VC!')
                .setDescription(`${welcomeMsg}\n\n**🎵 Now playing the entrance anthem!**`)
                .setThumbnail(track.thumbnail || null)
                .addFields(
                    { name: '👥 People in the VC', value: vcMembers },
                    { name: '🎶 Track', value: track.title || 'Welcome Anthem', inline: true },
                )
                .setFooter({ text: `Summoned by ${interaction.user.username} 🎺` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            try {
                await interaction.client.rest.put(
                    `/channels/${voice.id}/voice-status`,
                    { body: { status: '🎉 Welcome party in progress!' } }
                );
            } catch {}
        } catch (err) {
            console.error('  ❌ Welcome play error:', err.message);
            return interaction.editReply(`❌ Could not play welcome track: ${err.message}`);
        }
    },
};
