const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const weather = require('weather-js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('🌤️ Get the current weather for any location')
        .addStringOption(opt =>
            opt.setName('location').setDescription('City or location name').setRequired(true)
        ),

    async execute(interaction) {
        const location = interaction.options.getString('location');
        await interaction.deferReply();

        weather.find({ search: location, degreeType: 'C' }, async (error, result) => {
            if (error || !result || result.length === 0) {
                return interaction.editReply('❌ Invalid location or weather data unavailable.');
            }

            const current = result[0].current;
            const loc = result[0].location;

            const embed = new EmbedBuilder()
                .setAuthor({ name: `🌤️ Weather for ${current.observationpoint}` })
                .setDescription(`**${current.skytext}**`)
                .setThumbnail(current.imageUrl)
                .setColor(0x3498DB)
                .addFields(
                    { name: '🕐 Timezone', value: `UTC${loc.timezone}`, inline: true },
                    { name: '🌡️ Temperature', value: `${current.temperature}°C`, inline: true },
                    { name: '🤔 Feels Like', value: `${current.feelslike}°C`, inline: true },
                    { name: '💨 Wind', value: current.winddisplay, inline: true },
                    { name: '💧 Humidity', value: `${current.humidity}%`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        });
    },
};