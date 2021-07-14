const Discord = require('discord.js'); 
const { MessageEmbed } = require('discord.js');


module.exports = {
    name: 'suggest',
    aliases: ['suggest', 'suggestion'],
    permissions: [],
    cooldown: 1800,
    description: 'creates a suggestion!',
    async execute(bot, message, args) {
        const channel = bot.channels.cache.get('857043557079711754');
        const query = args.join(' ');
        if(!query) return message.reply('Please specify a suggestion!');

        let messageArgs = args.join(' ');
        const reportEmbed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTitle(`**Name**\n${message.author.username} \n\n**Suggestion**\n`)
        .setDescription(messageArgs);

        return channel.send(reportEmbed).then((msg) =>{
            msg.react('✅');
            msg.react('❌');
            message.delete();
        }).catch((err)=>{
            throw err;
        });
    }
}