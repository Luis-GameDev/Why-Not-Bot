const { SlashCommandBuilder } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    entersState, 
    VoiceConnectionStatus 
} = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Plays a predefined local song based on the selected country')
        .addStringOption(option =>
            option.setName('country')
                .setDescription('Select a country')
                .setRequired(true)
                .addChoices(
                    { name: 'Germany', value: 'germany' },
                    { name: 'Poland', value: 'poland' },
                    { name: 'Turkey', value: 'turkey' },
                    { name: 'Italy', value: 'italy' }
                )
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.voice.channel) {
            return interaction.editReply({ content: 'You must be in a voice channel to use this command.' });
        }

        const country = interaction.options.getString('country');
        let filePath;
        switch (country) {
            case 'germany':
                filePath = path.join(__dirname, '..', 'data', 'songs', 'germany_song.mp3'); 
                break;
            case 'poland':
                filePath = path.join(__dirname, '..', 'data', 'songs', 'poland_song.mp3');
                break;
            case 'turkey':
                filePath = path.join(__dirname, '..', 'data', 'songs', 'turkey_song.mp3'); 
                break;
            case 'italy':
                filePath = path.join(__dirname, '..', 'data', 'songs', 'italy_song.mp3'); 
                break;
            default:
                return interaction.editReply({ content: 'Invalid country selection.', ephemeral: true });
        }

        if (!fs.existsSync(filePath)) {
            return interaction.editReply({ content: 'The selected song file does not exist.' });
        }

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 60_000);
        } catch (error) {
            console.error('Error connecting to voice channel:', error);
            return interaction.editReply({ content: 'Failed to join the voice channel within 60 seconds.' });
        }

        const player = createAudioPlayer();
        connection.subscribe(player);

        const resource = createAudioResource(fs.createReadStream(filePath), {
            inputType: 'arbitrary', 
        });

        player.play(resource);

        await interaction.editReply(`Now playing the ${country} song.`);

        let isConnectionDestroyed = false;

        player.on(AudioPlayerStatus.Idle, () => {
            if (!isConnectionDestroyed) {
                connection.destroy();
                isConnectionDestroyed = true;
            }
        });

        player.on('error', error => {
            console.error('Audio player error:', error);
            if (!isConnectionDestroyed) {
                connection.destroy();
                isConnectionDestroyed = true;
            }
        });
    },
};
