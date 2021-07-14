const Discord = require('discord.js'); 
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "status",
    description: "status changer!" ,

    execute: async (bot, message, args) => {
    {
        const type = args[0]
        const status = args.slice(1).join(" ");
        if(!status) return message.channel.send(`You must specify a status.`)
    
        if(type === 'watching'){
          bot.user.setActivity(`${status}`, {
      type: "WATCHING"
    });

    const Embed = new Discord.MessageEmbed()
    .setColor("RANDOM")
    .setTitle(`Status have been changed to "${args.join(" ")}"  successfully!`)
    .setTimestamp()
    .setThumbnail(message.guild.iconURL({ dynamic: true }))

    return message.channel.send(Embed);


        } else if(type === 'listening'){
          bot.user.setActivity(`${status}`, {
            type: "LISTENING"
          });

          const Embed = new Discord.MessageEmbed()
          .setColor("RANDOM")
          .setTitle(`Status have been changed to "${args.join(" ")}"  successfully!`)
          .setTimestamp()
          .setThumbnail(message.guild.iconURL({ dynamic: true }))
          return message.channel.send(Embed);
        
        } else if(type === 'playing'){
          bot.user.setActivity(`${status}`, {
            type: "PLAYING"
          });
          const Embed = new Discord.MessageEmbed()
          .setColor("RANDOM")
          .setTitle(`Status have been changed to "${args.join(" ")}"  successfully!`)
          .setTimestamp()
          .setThumbnail(message.guild.iconURL({ dynamic: true }))
          return message.channel.send(Embed);


        } else if(type === 'streaming'){
          bot.user.setActivity(`${status}`, {
            type: "STREAMING",
            url: 'https://discord.gg/rjKV2QaCFx'
            
          });

          const Embed = new Discord.MessageEmbed()
          .setColor("RANDOM")
          .setTitle(`Status have been changed to "${args.join(" ")}"  successfully!`)
          .setTimestamp()
          .setThumbnail(message.guild.iconURL({ dynamic: true }))

          return message.channel.send(Embed);



        
        } else if(type === 'competing'){
          bot.user.setActivity(`${status}`, {
            type: "COMPETING"
          });

          
          const Embed = new Discord.MessageEmbed()
          .setColor("RANDOM")
          .setTitle(`Status have been changed to "${args.join(" ")}"  successfully!`)
          .setTimestamp()
          .setThumbnail(message.guild.iconURL({ dynamic: true }))
          
      
          return message.channel.send(Embed);

         
        } else if (type != ['watching', 'listening', 'playing', 'streaming', 'competing']) {
          message.channel.send("Your type must be valid. The valid status types are as following:\n`watching, listening, playing, streaming, competing`. Please try again, but this time with valid input. Thank you")
    
    
}} 
}};