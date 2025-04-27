const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch'); // Ensure you're using node-fetch v2
const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const sharp = require('sharp'); // Optional: Use sharp for format conversion
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eatdick')
        .setDescription('Make another member eat dick')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member that eats dick')
                .setRequired(true)
        ),
    async execute(interaction) {
        const dildoImage = await loadImage(path.join(__dirname, 'd.png')); 

        try {
            const user = interaction.options.getUser('member') || interaction.user;
        
            // Fetch the avatar URL
            const avatarURL = user.displayAvatarURL({ format: 'png', size: 512 });
            const response = await fetch(avatarURL);
        
            if (!response.ok) {
                throw new Error(`Failed to fetch avatar: ${response.statusText}`);
            }
        
            // Ensure the image type is supported
            const contentType = response.headers.get('content-type');
        
            if (!contentType || !contentType.startsWith('image/')) {
                throw new Error(`Invalid content type: ${contentType}`);
            }
        
            // Check for supported image formats
            const supportedFormats = ['image/png', 'image/jpeg', 'image/webp'];
            if (!supportedFormats.includes(contentType)) {
                throw new Error(`Unsupported image format: ${contentType}`);
            }
        
            let buffer = await response.buffer();
        
            // If the image is WebP, convert it to PNG using sharp
            if (contentType === 'image/webp') {
                buffer = await sharp(buffer).toFormat('png').toBuffer();
            }
        
            // Try loading the image
            const avatarImage = await loadImage(buffer);
        
            // Create canvas and context
            const canvas = createCanvas(512, 512);
            const ctx = canvas.getContext('2d');
        
            // Draw the avatar
            ctx.drawImage(avatarImage, 0, 0, canvas.width, canvas.height);
        
            // Draw the dildo overlay
            const dildoWidth = 500; // Adjust size
            const dildoHeight = 500; // Adjust size
            const dildoX = canvas.width - dildoWidth + 100; // Bottom right corner
            const dildoY = canvas.height / 1.4 - dildoHeight / 2; // Centered vertically
            ctx.drawImage(dildoImage, dildoX, dildoY, dildoWidth, dildoHeight);
        
            // Export the image
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'd.png' });
        
            // Send the image
            await interaction.reply({ content: `Hey, I found proof of ${user} eating dick!`, files: [attachment] });
        
        } catch (error) {
            await interaction.reply(`Failed to process the image. Error: ${error.message}`);
        }

    },
};
