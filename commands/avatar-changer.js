const Discord = require('discord.js');


module.exports = {
  name: 'set-avatar',
  category: 'Owner',
 execute: async (bot, message, args) => { // change your handler
   let avatarurl = args.join(" ");
   bot.user.setAvatar(`${avatarurl}`)
   if (!avatarurl) return message.channel.send("!!set-avatar <link>")
   let embed = new Discord.MessageEmbed()
       .setTitle('Avatar has been changed!')
       .setImage(`${avatarurl}`)
       .setTimestamp()
    message.channel.send(embed)
    .catch(e => {
        console.log(e)
        return message.channel.send("Something Went Wrong!")
    })
}
}