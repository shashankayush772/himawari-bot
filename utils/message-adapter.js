/**
 * MessageAdapter - Makes traditional prefix messages work with slash command handlers.
 * Wraps a Discord.js Message to mimic a ChatInputCommandInteraction.
 */

class OptionsAdapter {
    constructor(args, message, commandData) {
        this._parsed = {};
        this._data = [];
        this._message = message;

        if (!commandData) return;

        // Get option definitions from SlashCommandBuilder
        const optionDefs = commandData.toJSON().options || [];
        const remainingArgs = [...args];

        for (let i = 0; i < optionDefs.length; i++) {
            const opt = optionDefs[i];
            const isLast = i === optionDefs.length - 1;

            switch (opt.type) {
                case 6: { // USER
                    // Look for a mention or raw user ID
                    let userId = null;
                    for (let j = 0; j < remainingArgs.length; j++) {
                        const mentionMatch = remainingArgs[j].match(/^<@!?(\d+)>$/);
                        if (mentionMatch) {
                            userId = mentionMatch[1];
                            remainingArgs.splice(j, 1);
                            break;
                        }
                        if (/^\d{17,20}$/.test(remainingArgs[j])) {
                            userId = remainingArgs[j];
                            remainingArgs.splice(j, 1);
                            break;
                        }
                    }
                    if (userId) {
                        this._parsed[opt.name] = { userId, type: 'user' };
                        this._data.push({ name: opt.name, value: `<@${userId}>`, type: opt.type });
                    }
                    break;
                }

                case 7: { // CHANNEL
                    for (let j = 0; j < remainingArgs.length; j++) {
                        const match = remainingArgs[j].match(/^<#(\d+)>$/);
                        if (match) {
                            this._parsed[opt.name] = { channelId: match[1], type: 'channel' };
                            this._data.push({ name: opt.name, value: `<#${match[1]}>`, type: opt.type });
                            remainingArgs.splice(j, 1);
                            break;
                        }
                    }
                    break;
                }

                case 8: { // ROLE
                    for (let j = 0; j < remainingArgs.length; j++) {
                        const match = remainingArgs[j].match(/^<@&(\d+)>$/);
                        if (match) {
                            this._parsed[opt.name] = { roleId: match[1], type: 'role' };
                            this._data.push({ name: opt.name, value: `<@&${match[1]}>`, type: opt.type });
                            remainingArgs.splice(j, 1);
                            break;
                        }
                    }
                    break;
                }

                case 3: { // STRING
                    let value;
                    if (isLast || optionDefs.filter(o => o.type === 3).length === 1) {
                        // Last option or only string option: join ALL remaining args
                        value = remainingArgs.join(' ');
                        remainingArgs.length = 0;
                    } else {
                        value = remainingArgs.shift();
                    }
                    if (value) {
                        this._parsed[opt.name] = { value, type: 'string' };
                        this._data.push({ name: opt.name, value, type: opt.type });
                    }
                    break;
                }

                case 4: { // INTEGER
                    const raw = remainingArgs.shift();
                    if (raw && !isNaN(parseInt(raw))) {
                        const value = parseInt(raw);
                        this._parsed[opt.name] = { value, type: 'integer' };
                        this._data.push({ name: opt.name, value, type: opt.type });
                    }
                    break;
                }

                case 10: { // NUMBER
                    const raw = remainingArgs.shift();
                    if (raw && !isNaN(parseFloat(raw))) {
                        const value = parseFloat(raw);
                        this._parsed[opt.name] = { value, type: 'number' };
                        this._data.push({ name: opt.name, value, type: opt.type });
                    }
                    break;
                }

                case 5: { // BOOLEAN
                    const raw = remainingArgs.shift();
                    if (raw) {
                        const value = ['true', 'yes', '1', 'on'].includes(raw.toLowerCase());
                        this._parsed[opt.name] = { value, type: 'boolean' };
                        this._data.push({ name: opt.name, value, type: opt.type });
                    }
                    break;
                }
            }
        }
    }

    getString(name) {
        return this._parsed[name]?.type === 'string' ? this._parsed[name].value : null;
    }

    getUser(name) {
        const data = this._parsed[name];
        if (!data || data.type !== 'user') return null;
        return this._message.client.users.cache.get(data.userId) || null;
    }

    getMember(name) {
        const data = this._parsed[name];
        if (!data || data.type !== 'user') return null;
        return this._message.guild?.members.cache.get(data.userId) || null;
    }

    getChannel(name) {
        const data = this._parsed[name];
        if (!data || data.type !== 'channel') return null;
        return this._message.client.channels.cache.get(data.channelId) || null;
    }

    getRole(name) {
        const data = this._parsed[name];
        if (!data || data.type !== 'role') return null;
        return this._message.guild?.roles.cache.get(data.roleId) || null;
    }

    getInteger(name) {
        return this._parsed[name]?.type === 'integer' ? this._parsed[name].value : null;
    }

    getNumber(name) {
        return this._parsed[name]?.type === 'number' ? this._parsed[name].value : null;
    }

    getBoolean(name) {
        return this._parsed[name]?.type === 'boolean' ? this._parsed[name].value : null;
    }

    getSubcommand() {
        return null;
    }

    getAttachment(name) {
        return null;
    }

    get data() {
        return this._data;
    }
}


class MessageAdapter {
    constructor(message, commandName, args, commandData) {
        this.message = message;
        this.commandName = commandName;

        // Mirror interaction properties
        this.user = message.author;
        this.member = message.member;
        this.guild = message.guild;
        this.client = message.client;
        this.channel = message.channel;
        this.channelId = message.channelId;
        this.guildId = message.guildId;
        this.createdTimestamp = message.createdTimestamp;

        // State tracking
        this.replied = false;
        this.deferred = false;
        this._deferMessage = null;
        this._lastReply = null;

        // Parse options
        this.options = new OptionsAdapter(args, message, commandData);

        // Flag so commands can check if this is a prefix command
        this.isPrefix = true;
    }

    async reply(options) {
        if (typeof options === 'string') options = { content: options };

        // Remove ephemeral (can't do ephemeral with prefix)
        delete options.ephemeral;

        const sent = await this.message.reply(options);
        this.replied = true;
        this._lastReply = sent;

        // If fetchReply was set, return the sent message (like interaction.reply does)
        if (options.fetchReply) return sent;
        return sent;
    }

    async deferReply(options) {
        this.deferred = true;
        this._deferMessage = await this.message.reply('⏳ Processing...');
        return this._deferMessage;
    }

    async editReply(options) {
        if (typeof options === 'string') options = { content: options, embeds: [] };
        delete options.ephemeral;

        const target = this._deferMessage || this._lastReply;
        if (target) {
            return target.edit(options);
        }
        // Fallback: just reply
        return this.message.reply(options);
    }

    async followUp(options) {
        if (typeof options === 'string') options = { content: options };
        delete options.ephemeral;
        return this.message.reply(options);
    }

    async deleteReply() {
        const target = this._deferMessage || this._lastReply;
        if (target) {
            try { await target.delete(); } catch {}
        }
    }

    isChatInputCommand() {
        return true;
    }
}

module.exports = { MessageAdapter };
