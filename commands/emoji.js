const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steal')
        .setDescription('😀 Add an emoji to this server')
        .addStringOption(opt => opt.setName('emoji').setDescription('The emoji or image URL to add').setRequired(true))
        .addStringOption(opt => opt.setName('name').setDescription('Name for the emoji (required for URL)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

    async execute(interaction) {
        const emojiInput = interaction.options.getString('emoji');
        const customName = interaction.options.getString('name');

        const customMatch = emojiInput.match(/<(a)?:(\w+):(\d+)>/);

        if (customMatch) {
            const animated = customMatch[1] === 'a';
            const name = customName || customMatch[2];
            const id = customMatch[3];
            const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;

            try {
                const emoji = await interaction.guild.emojis.create({ attachment: url, name });
                await interaction.reply(`✅ **${interaction.user.username}**, emoji \`:${emoji.name}:\` ${emoji} was successfully added!`);
            } catch {
                await interaction.reply({ content: '❌ Cannot add this emoji. Server may be at emoji limit.', ephemeral: true });
            }
        } else {
            if (!customName) {
                return interaction.reply({ content: '❌ You must provide a `name` when adding an emoji from a URL.', ephemeral: true });
            }
            if (customName.length > 32) {
                return interaction.reply({ content: '❌ Emoji name cannot exceed 32 characters.', ephemeral: true });
            }

            try {
                const emoji = await interaction.guild.emojis.create({ attachment: emojiInput, name: customName });
                await interaction.reply(`✅ **${interaction.user.username}**, emoji \`:${emoji.name}:\` ${emoji} was successfully added!`);
            } catch {
                await interaction.reply({ content: '❌ Cannot add this emoji. Check the URL or try again.', ephemeral: true });
            }
        }
    },
};