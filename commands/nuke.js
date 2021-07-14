const Discord = require('discord.js'); 
module.exports = {
    name: "nuke",
    description: "Helping format for bug report!" ,

    execute: async (bot, message, args) => {

let clearchannel = message.channel || message.channel.mentions.first()
clearchannel.clone()
clearchannel.delete()

}};