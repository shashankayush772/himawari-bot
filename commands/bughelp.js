const Discord = require('discord.js'); 
module.exports = {
    name: "bughelp",
    description: "Helping format for bug report!" ,

    execute: async (bot, message, args) => {
        

     const Embed = new Discord.MessageEmbed()
    .setColor("RANDOM")
    .setTitle(' You can report a bug simply by doing this below! ')
    .setDescription(" ```You have a cooldown of 20 minutes after reporting a bug to report another bug! \n \n!!bugreport <your report>``` \n \n **I hope you will keep supporting us. So, we can fix the bugs and make our discord server playful!**")
    .setFooter(message.guild.name)
    .setTimestamp()

    return message.channel.send(Embed);
    

    }
}