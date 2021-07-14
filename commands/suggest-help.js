const Discord = require('discord.js'); 
module.exports = {
    name: "suggesthelp",
    description: "Helping format for suggestion!" ,

    execute: async (bot, message, args) => {
        

     const Embed = new Discord.MessageEmbed()
    .setColor("RANDOM")
    .setTitle(' You can give a suggestion simply by doing this below! ')
    .setDescription(" ```You have a cooldown of 20 minutes after giving a suggestion to give another suggestion! \n \n!!suggest <Your Suggestion>``` \n\n Do it in <#816730490026328065>! \n\n **I hope you will keep supporting us. So, we can plan new things and discord server playful!**")
    .setTimestamp()
    

    return message.channel.send(Embed);
    message.delete();

    }
}