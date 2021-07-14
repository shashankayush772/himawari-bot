const Discord = require('discord.js');

module.exports = {
    name: 'bot-ping',
    description: 'ping command',
    async execute(bot, message, args) {
            let member = message.member;
            let embed = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setTitle(`PONG! ⚡`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                {name: 'Latency', value: `\`${Date.now() - message.createdTimestamp}ms\``},
                {name: 'API Latency', value: `\`${Math.round(bot.ws.ping)}ms\``},
            )
    message.channel.send(embed);
    
    }
}