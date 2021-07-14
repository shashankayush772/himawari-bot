const Discord = require('discord.js'); 
module.exports = {
    name: "avatar",
    description: "Shows your avatar!" ,

    execute: async (bot, message, args) => {

    const avatarEmbed = new Discord.MessageEmbed()
    .setColor("#00ffeb")
    .setAuthor(message.author.username + '\'s avatar')
    .setImage(message.author.avatarURL({size: 4096, dynamic: true}));

    message.channel.send(avatarEmbed)

    }
}