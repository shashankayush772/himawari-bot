'use strict';

const Discord = require('discord.js')

module.exports = {
    name: 'steal',
    execute: async (bot, message, args) => {
        if(!message.member.hasPermission("ADD_EMOJI")) return message.channel.send("You do not have Add emoji permission to execute this command!");
    if(!args[0]) return message.channel.send('Please specify emoji to add!');

    const emoji = Discord.Util.parseEmoji(args[0]);
    
    if(emoji.id){
        const emojiFormat = emoji.animated ? '.gif' : '.png';
        const emojiUrl = `https://cdn.discordapp.com/emojis/${emoji.id + emojiFormat}`;
    
        await message.guild.emojis.create(emojiUrl, `${args[1] ? args[1] : emoji.name}`)
            .then((emoji) => {
                    messag.channel.send(`**${message.author.username}**, emoji \`:${emoji.name}:\` ${emoji} was successfully added.`)
                }).catch(() => { message.channel.send('Cannot add this emoji, try again later.') });  
    } else {
        const emojiLink = args[0];
        
        if(!args[1]) return message.channel.send('You must enter a name for the emoji.');
        if(args[1].length > 32) return message.channel.send('The name of the emoji cannot exceed 32 characters!');
        await message.guild.emojis.create(emojiLink, args[1])
                .then((emoji) => {
                    message.channel.send(`**${message.author.username}**, emoji \`:${emoji.name}:\` ${emoji} was successfully added.`)
            }).catch(() => { message.channel.send('Cannot add this emoji, try again later.') });
        }
    }
};