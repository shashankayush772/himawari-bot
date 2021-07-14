const Discord = require('discord.js'); 
module.exports = {
    name: "pending",
    description: "Pending work!" ,

    execute: async (bot, message, args) => {
        


     const Embed = new Discord.MessageEmbed()
    .setColor("RED")
    .setTitle('THIS IS UNDER MAINTENANCE!')
    .setTimestamp()
    .setImage("https://static.wixstatic.com/media/b3ae7c_4863108e29a747edabbdf983bb1409e7~mv2.gif")
    .setThumbnail('https://images-ext-2.discordapp.net/external/uq58kKNjo6vMAKgA0yZ8_mGP6zoeiWStoNW4A7nj5aE/https/cdn.discordapp.com/icons/828545168353132564/7c5690f396c9e3d909f476c1c8900bce.png')

    return message.channel.send(Embed);
    message.delete();

    }
}