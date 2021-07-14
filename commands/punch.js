const Discord = require('discord.js');
const { Message } = require('discord.js');
const punchs = [
    'https://media1.tenor.com/images/ee3f2a6939a68df9563a7374f131fd96/tenor.gif?itemid=14210784',
    'https://media.tenor.com/images/8e51636630e8eed819dd59f92c928795/tenor.gif',
    'https://media.tenor.com/images/1dcba5faac6462fa788487c99cd678c9/tenor.gif',
    'https://media.tenor.com/images/2dfb030da07fe89448bb636c5e969ece/tenor.gif',
    'https://images-ext-1.discordapp.net/external/JTQxjkNSP03Fk9APzYL3tlCVtV3ocq97jr-sFxgxeHs/https/cdn.weeb.sh/images/ryYo_6bWf.gif',
    'https://images-ext-2.discordapp.net/external/POYEseNsbVcW5YM9ccCtFb-EPVooQl4jFzMGs9B3sbs/https/cdn.weeb.sh/images/HykeDaZWf.gif?width=718&height=427',
    'https://images-ext-1.discordapp.net/external/w4pvWUqZ7DwYsphKvaSKMFXNarCngEd1cc_ZBTw0ISs/https/cdn.weeb.sh/images/rJHLDT-Wz.gif',
    'https://images-ext-2.discordapp.net/external/BZPa2Wx7vXciXcOIbU_SsU1myt7tA7YwCY_WcI4ceNo/https/cdn.weeb.sh/images/BJg7wTbbM.gif',
    'https://images-ext-1.discordapp.net/external/fHgnbSkpcmTE6MbsI9OPVhcKkzkB1x1-Mj-qARrBJ5E/https/cdn.weeb.sh/images/BkdyPTZWz.gif'
];
module.exports = {
    name: "punch",
    description: "punch a person",
    usage: "punch <user>",
    category: "anime/roleplay",
    execute: async (bot, message, args) => {
        const user = message.mentions.users.first();
        if (!user) return message.channel.send('Oh oh... you gotta provide a valid user to punch :/');
        return message.channel.send(new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setImage(punchs[Math.floor(Math.random() * punchs.length)])
            .setDescription(`${message.author.username} punched ${user.username}!`)
        );
    }
}