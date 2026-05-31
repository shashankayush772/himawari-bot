const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const prefixFile = path.join(__dirname, '..', 'guild-prefixes.json');

function loadPrefixes() {
    try {
        if (fs.existsSync(prefixFile)) {
            return JSON.parse(fs.readFileSync(prefixFile, 'utf8'));
        }
    } catch {}
    return {};
}

function savePrefixes(data) {
    fs.writeFileSync(prefixFile, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('⚙️ Change the bot prefix for this server')
        .addStringOption(opt =>
            opt.setName('new_prefix')
                .setDescription('The new prefix (e.g. !, ?, ., -)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const newPrefix = interaction.options.getString('new_prefix');

        if (newPrefix.length > 5) {
            return interaction.reply({ content: '❌ Prefix must be 5 characters or less!', ephemeral: true });
        }

        const prefixes = loadPrefixes();
        prefixes[interaction.guildId] = newPrefix;
        savePrefixes(prefixes);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('⚙️ Prefix Updated')
            .setDescription(`The bot prefix for this server has been changed to \`${newPrefix}\``)
            .addFields(
                { name: '📝 Usage', value: `\`${newPrefix}play\`, \`${newPrefix}help\`, \`${newPrefix}ping\``, inline: false }
            )
            .setFooter({ text: `Changed by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    // Export helpers so index.js can use them
    loadPrefixes,
};
