const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('facepalm')
        .setDescription('🤦 Generate a facepalm image with a user\'s avatar')
        .addUserOption(opt => opt.setName('user').setDescription('The user (defaults to you)')),

    async execute(interaction) {
        await interaction.deferReply();

        const member = interaction.options.getMember('user') || interaction.member;

        try {
            const canvas = createCanvas(632, 357);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, 632, 357);

            const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 });
            const avatarRes = await fetch(avatarURL);
            const avatarBuf = Buffer.from(await avatarRes.arrayBuffer());
            const avatar = await loadImage(avatarBuf);
            ctx.drawImage(avatar, 199, 112, 235, 235);

            const layerRes = await fetch('https://raw.githubusercontent.com/Androz2091/AtlantaBot/master/assets/img/facepalm.png');
            const layerBuf = Buffer.from(await layerRes.arrayBuffer());
            const layer = await loadImage(layerBuf);
            ctx.drawImage(layer, 0, 0, 632, 357);

            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'facepalm.png' });
            await interaction.editReply({ files: [attachment] });
        } catch {
            await interaction.editReply('❌ Failed to generate facepalm image. Try again later!');
        }
    },
};