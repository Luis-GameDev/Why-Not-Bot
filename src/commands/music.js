const { SlashCommandBuilder } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    entersState, 
    VoiceConnectionStatus 
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Plays a predefined song based on the selected country')
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
        let url;
        switch (country) {
            case 'germany':
                url = 'https://www.youtube.com/watch?v=cH3Cihr6FWo'; 
                break;
            case 'poland':
                url = 'https://www.youtube.com/watch?v=OyDyOweu-PA'; 
                break;
            case 'turkey':
                url = 'https://www.youtube.com/watch?v=FdNl8KxuY24'; 
                break;
            case 'italy':
                url = 'https://www.youtube.com/watch?v=0aUav1lx3rA'; 
                break;
            default:
                return interaction.editReply({ content: 'Invalid country selection.', ephemeral: true });
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

        const stream = ytdl(url, { filter: 'audioonly' });
        const resource = createAudioResource(stream);

        player.play(resource);

        await interaction.editReply(`Now playing the ${country} song.`);

        player.on(AudioPlayerStatus.Idle, () => connection.destroy());
        player.on('error', error => {
            console.error('Audio player error:', error);
            connection.destroy();
        });
    },
};
