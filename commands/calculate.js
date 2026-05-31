const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const math = require('mathjs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculate')
        .setDescription('🧮 Calculate a math expression')
        .addStringOption(opt =>
            opt.setName('expression').setDescription('The math expression to evaluate').setRequired(true)
        ),

    async execute(interaction) {
        const expression = interaction.options.getString('expression');

        let result;
        try {
            result = math.evaluate(
                expression.replace(/[x]/gi, '*').replace(/[,]/g, '.').replace(/[÷]/gi, '/')
            );
        } catch {
            return interaction.reply({
                content: '❌ **Invalid expression!**\n\n**Examples:**\n• `sqrt(3^2 + 4^2)` → 5\n• `2 inch to cm` → 5.08\n• `cos(45 deg)` → 0.707\n• `2.5 - 2` → 0.5',
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setAuthor({ name: `${interaction.client.user.username} Calculator`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .addFields(
                { name: '📥 Expression', value: `\`\`\`${expression}\`\`\`` },
                { name: '📤 Result', value: `\`\`\`${result}\`\`\`` }
            )
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};