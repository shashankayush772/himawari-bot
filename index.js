 const Discord = require('discord.js') 
const bot = new Discord.Client({ws: {intents: Discord.Intents.ALL}});

const fs = require("fs");
const { execute } = require('./commands/clear');

bot.commands = new Discord.Collection();


bot.on('ready', () => {
    console.log('This bot is online!')

    fs.readdir('./commands', (err, files) => {
        if(err) return console.log(err);

        let jsfile = files.filter(f => f.split(".").pop() == 'js');


        if (jsfile.length <= 0) return console.log("Could not find commands!")

        jsfile.forEach(f => {
            let props = require(`./commands/${f}`);
            bot.commands.set(props.name, props)
        })
    })
});

bot.on('message', (message) => {
    if(message.author.bot) return;
    if(message.channel.type !== 'text') return;
if(message.author.id !== '785907081076932638') return;
    let prefix = 'k!';

    
    
    let MessageArray = message.content.split(' ');
    let cmd = MessageArray[0].slice(prefix.length)
    let args = MessageArray.slice(1)

    if(!message.content.startsWith(prefix)) return;

    let commandfile = bot.commands.get(cmd);
    if(commandfile) {commandfile.execute(bot, message, args)} 
       
    
    


});

bot.login("ODY0NzY2MzA0NDg0MzI3NDI0.YO6OYQ._E9aumztjQkbmFV8ElFWFAe5zLc");
