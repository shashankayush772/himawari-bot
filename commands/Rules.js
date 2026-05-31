const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('📜 Display the server rules'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FFEB)
            .setTitle('📜 RULES')
            .setDescription(
                '**General Rules**\n\n' +
                'I. Keep communication in English as much as possible.\n' +
                'II. No hate, toxic behavior, sexism, or racism.\n' +
                'III. Don\'t spam, spoil, flood chat with CAPS, or line-split.\n' +
                'IV. Starting or participating in drama is forbidden.\n' +
                'V. Disrespecting members or servers is not allowed.\n' +
                'VI. Rule evasion or testing limits is not allowed.\n' +
                'VII. Don\'t promote cruelty, violence, self-harm, or pornography.\n' +
                'VIII. No begging, stalking, or threatening.\n' +
                'IX. Raiding or planning raids is forbidden.\n' +
                'X. Keep things SFW in all channels.\n' +
                'XI. No advertising. DM advertising is strictly forbidden.\n\n' +
                '**Voice Chat Rules**\n\n' +
                'I. No ear-rape or unwanted soundboards/voice changers.\n' +
                'II. No voice chat surfing.\n' +
                'III. Use push-to-talk if you have background noise.\n' +
                'IV. Give others a chance to use music bots.\n' +
                'V. Respect private channel limits.'
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};