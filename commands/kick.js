const discord = require("discord.js");

module.exports = {
  name: "kick",
  category: "moderation",
  description: "Kick anyone with one shot xD",
  usage: "kick <@user> <reason>",
  category: ` (:Moderation:) moderation`,
  execute : async(bot, message, args) => {
    
    let Embede = new MessageEmbed()
     Embede.setDescription(`**You don't have permissions to use this command!**`)
     Embede.setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic : true }))
     Embede.setColor("#028EA4")

if(!message.member.hasPermission("KICK_MEMBERS")) {
      return message.channel.send(Embede);
    }

if(!message.guild.me.hasPermission("KICK_MEMBERS")) {
      return message.channel.send(`**${message.author.username}**, I do not have permissions to use this command`)
    }
    
     let target = message.mentions.members.first();
    
    if(!target) {
      return message.channel.send(`**${message.author.username}**, Please mention the user who you want to kick`)
    }

if(target.id === message.author.id) {
     return message.channel.send(`**${message.author.username}**, You can not kick yourself`)
    }

 if(!args[1]) {
    return message.channel.send(`**${message.author.username}**, Please Give A Reason to kick`)
  }

let embed = new discord.MessageEmbed()
    .setTitle("Action: Kick")
    .setDescription(`Kick ${target} (${target.id})`)
    .setColor("#028EA4")
    .setFooter(`Kicked by ${message.author.username}`);
    
    message.channel.send(embed)
    
    target.kick(args[1]);

target.kick(args[1]); 

    
     }
 }