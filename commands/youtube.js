const Discord = require('discord.js'); 
const { MessageEmbed } = require('discord.js');
const ytsr = require("ytsr");

module.exports = {
    name: "youtube",
    description: "searches videos on youtube!",
    usage: "youtube <channel> <video>",
    category: "youtube video",
    execute: async (bot, message, args) => {
        if(message.author.id !== '808729440091373599') return message.channel.send(':x: | Only Owner can use this command!');
    const query = args.join(" ");
    if(!query) return message.channel.send("Please provide a search query!");

    const res = await ytsr(query).catch(e => {
        return message.channel.send("No results were found!");
    });

    const video = res.items.filter(i => i.type == "video" )[0];
    if(!video) return message.channel.send("No results were found!");

    const embed = new MessageEmbed()
    .setTitle(video.title)
    .setImage(video.bestThumbnail.url)
    .setColor("#00ffeb")
    .setDescription(`**[${video.url}](${video.url})**`)
    .setAuthor(video.author.name)
    .addField("Views", video.views.toLocaleString(), true)
    .addField("Duration", video.duration, true)

    return message.channel.send(embed);
}};