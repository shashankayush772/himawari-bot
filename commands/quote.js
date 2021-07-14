// npm i canvacord
const canvacord = require('canvacord');
// npm i discord.js
const Discord = require('discord.js');
module.exports = {
    name: 'reply',
    description: 'Generate a fake image of a member replying to another member!',
    aliases: ['fakereply'],
    group: 'image',
    guildOnly: true,
    parameters: ['Member 1', 'Member 2', 'Main Message', 'Reply Message'],
    examples: ['reply @Coffee | @Zed | I am epic | Facts'],
    preview: 'https://cdn.discordapp.com/attachments/811786924426919980/814499812271063059/replyimage.png',
    clientPermissions: ['ATTACH_FILES'],
    execute: async (bot, message, args) => {
      const replyArgs = message.content.split(" ").slice(1).join(" ").split("\n").join("").split(" | ");
      const member1 = message.mentions.members.first(5)[0] || message.guild.members.cache.get(replyArgs[0]);
        if(!member1) return message.channel.send("Please provide the first member!")
      const member2 = message.mentions.members.first(5)[1] || message.guild.members.cache.get(replyArgs[1]);
        if(!member2) return message.channel.send("Pleade rpovide the second member!")
        const msg1 = replyArgs[2];
        if(!msg1) return message.channel.send("Please provide the main message!")
        const msg2 = replyArgs[3]
        if(!msg2) return message.channel.send("Please provide the reply message!")
const img = member1.user.displayAvatarURL({ format: 'png' })
const img2 = member2.user.displayAvatarURL({ format: 'png' })
let k = await canvacord.Canvas.reply({
     avatar1: img,
     avatar2: img2,
     user1: member1.displayName,
     user2: member2.displayName,
     hex1: member1.displayHexColor,
     hex2: member2.displayHexColor,
     mainText: msg1,
     replyText: msg2
})
const replyimg = new Discord.MessageAttachment(k, 'replyimage.png')
return message.channel.send(replyimg)
    }
}