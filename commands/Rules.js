const Discord = require('discord.js'); 
module.exports = {
    name: ">Rules!",
    description: "Rules of the server!" ,

    execute: async (bot, message, args) => {

     const Embed = new Discord.MessageEmbed()
    .setColor("#00ffeb")
    .setTitle('RULES!')
    .setDescription('**General Rules** \n \n\n I. Keep all communication as much English as possible. \n\n II.  No hate, toxic behavior, sexism, or racism of any kind. \n\n  III.  Dont spam, spoil things, flood chat with CAPS, or line-split. \n\n IV.  Starting or participating in drama of any kind is strictly forbidden. \n\n  V.  Disrespecting other members or servers is not allowed. \n VI.  Rule evasion or attempts to test the limits of what is possible is not allowed. \n\n VII.  Dont promote cruelty, violence, self-harm, suicide or pornography. \n\n VIII.  No begging, stalking or threatening. \n\n IX.  Raiding or planning raids is strictly forbidden. \n\n  X.  Keep things safe for work in all channels. \n\n XI.  Dont advertise in any way. Especially DM advertising another Discord server is strictly forbidden. \n\n\n\n\n **Voice Chat Rules** \n\n\n  I.  Dont ear-rape or use soundboards/voice changers if people dont want it. \n\n  II.  No voice chat surfing. \n\n  III.  Use push to talk if you have a shitty microphone or have a lot background noise. \n\n IV.  Give other members a chance to play music on the music bots. \n\n V.  Private channels are made for private talks. Dont use bots in there and dont exceed the channel limit.')
    .setFooter(' Made by Ꮐ𝐗・PRO#8700')
    .setTimestamp()
    .setThumbnail('https://images-ext-2.discordapp.net/external/uq58kKNjo6vMAKgA0yZ8_mGP6zoeiWStoNW4A7nj5aE/https/cdn.discordapp.com/icons/828545168353132564/7c5690f396c9e3d909f476c1c8900bce.png')
    return message.channel.send(Embed);
    

    }
}