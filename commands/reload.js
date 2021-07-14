module.exports = {
    name: 'reload',
    category: 'Dev',
    aliases: ['restart', 'rl'],
    cooldown: 5,
    usage: `reload <category> <command>`,
    description: 'Reloads a command',
    execute: async (client, message, args, user, text, prefix) => {
        
        if(!args[0]) return message.channel.send('You need to include the command :tools: ')
        let command = args[0].toLowerCase();
        try {
            delete require.cache[require.resolve(`../commands/${command}`)]//Change the path depending on how are your folders located.
            client.commands.delete(command);
            const pull = require(`../commands/${command}`);
            client.commands.set(command, pull);

            return message.channel.send(`**${command}** was reloaded succesfully!:white_check_mark:  `);
        } catch (error) {
            return message.channel.send(`There was an error trying to reload **${command}**: \`${error.message}\``);
        }
    }
}