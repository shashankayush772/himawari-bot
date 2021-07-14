const { Client, Message, MessageEmbed } = require("discord.js");

module.exports = {
  name: "say-embed",
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   */
  
  execute: async (bot, message, args) => {
    let textChannel = message.mentions.channels.first()
    if(!args[0]) return message.channel.send('Provide a channel for me to send the message in!'); // args are words or numbers after the command. The first word is args[0], and then args[1], and so on and so on.
        if(!args[1]) return message.channel.send('Provide a message to say!');
        if (!message.guild.channels.cache.has(textChannel.id)) return;
    const sayEmbed = new MessageEmbed()
        .setDescription( args.slice(1).join(" "))
        .setTimestamp()
        .setColor("#00ffeb")

    message.channel.send(sayEmbed)
    message.delete();

    
  },
};