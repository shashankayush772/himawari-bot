const Discord = require('discord.js'); 
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'purge',
    aliases: ["cl", "delete"], 
    description: "Clear messages",
    async execute(bot, message, args){

        if(!args[0]) return message.reply("Please enter the amount of messages that you want to clear!");
        if(isNaN(args[0])) return message.reply("Please enter a real number!");

        if(args[0] > 100) return message.reply("You can't delete more than 100 messages!");
        if(args[0] < 1) return message.reply("You must delete atleast one message!");

        await message.channel.messages.fetch({ limit: args[0] }).then((messages) => {
            message.channel.bulkDelete(messages);

            const Embed = new Discord.MessageEmbed()
     .setColor("RANDOM")
     .setDescription(`Successfully deleted ***${args.join(" ")}*** messages by the order of ***${message.author.tag}*** !`)
     .setTimestamp()

     return message.channel.send(Embed);

        });
    },
};