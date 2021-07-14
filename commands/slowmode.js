const Discord = require('discord.js');
module.exports = {
    name: 'slowmode',
    description: 'Sets SlowMode for a Channel',
async execute( bot, message, args){
    if (!message.member.hasPermission("BAN_MEMBERS")){
        messages.channel.send(new Discord.MessageEmbed() .setDescription('You Cannot do that, Missing Permissions') .setColor('RED'))
        return;
    }

    if (!args[0]) return message.channel.send(new Discord.MessageEmbed() .setDescription('Heres the right format to do it!\n```!!slowmode <time>```') .setColor('RANDOM') .setThumbnail((message.guild.iconURL({ dynamic: true }))));
    if(isNaN(args[0])) return message.channel.send(new Discord.MessageEmbed() .setDescription('Please type a real number!') .setColor('RANDOM'));
    if (args[0] > 21600 || args[0] < 0) return message.channel.send(new Discord.MessageEmbed() .setDescription('Number must be between 0 - 21600') .setColor('RANDOM'))

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]) || message.channel

        channel.setRateLimitPerUser(args[0])
        message.channel.send(new Discord.MessageEmbed() .setDescription(`Slow Mode has been set to "${args[0]}" by the order of **${message.author.tag}**`) .setColor('RANDOM') .setThumbnail((message.guild.iconURL({ dynamic: true }))))
        return;

 message.channel.send(new Discord.MessageEmbed() .setDescription(`Slow Mode has been set to "${args[0]}" by the order of **${message.author.tag}**`) .setColor('RANDOM') .setThumbnail((message.guild.iconURL({ dynamic: true }))))

    .catch((e) => {
        message.channel.send('Error Occured!')
        e ? console.error(e) : console.log('Uknown Error')
    })
}
}