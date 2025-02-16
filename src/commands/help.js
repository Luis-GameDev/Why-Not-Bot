const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows and explains all available commands')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Show the commands for normal users or officers')
                .setRequired(true)
                .addChoices(
                    { name: 'member', value: 'member' },
                    { name: 'officer', value: 'officer' }
                )
        ),
    async execute(interaction) {
        const typeOption = interaction.options.getString('type');

        if(typeOption === 'member') {
            let embed = new EmbedBuilder()
                .setTitle('Member Commands')
                .setDescription('Here are the commands available for members:')
                .setColor(0x1e90ff)
                .addFields(
                    { name: '/plusinfo', value: 'Displays all +1s of a specified user.' },
                    { name: '/plustop', value: 'Lists the top members with the most +1s.' },
                    { name: '/attendance content', value: 'Tracks every user within your voice channel and adds a content +1 to them, this command may only be used by the caller of the content as he will get double points.' },
                    { name: '/link', value: 'Links your discord account to your Albion Account, this command may only be used if you are already part of the guild ingame.' },
                    { name: '/plusedit', value: 'Lets you edit the time of your selfgiven Rat +1s.' },
                    { name: '/eatdick', value: 'Shows proof of a specified member eating dick.' },
                    { name: '/vouch', value: 'Vouch for another member.' },
                    { name: '/vouchlist', value: 'Shows the list of all the vouches you have given or received.' },
                    { name: '/removevouch', value: 'Removes the vouch you gave to another member.' },
                    { name: '/plusweekly', value: 'Shows the +1s you have received within the past 7 days.' },
                    { name: '/info', value: 'Shows an info-card of the specified member including +1s, Ingame-Name, Roles and much more.' },
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        }
        if(typeOption === 'officer') {
            let embed = new EmbedBuilder()
                .setTitle('Officer Commands')
                .setDescription('Here are the commands available for officers:')
                .setColor(0x1e90ff)
                .addFields(
                    { name: '/giveaway start', value: 'Creates a giveaway that has increased winning chances based on rat +1s.' },
                    { name: '/giveaway roll', value: 'Manually rolls a giveaway.' },
                    { name: '/attendance cta', value: 'Tracks every user within your voice channel, this command may only be used by the CTA caller himself as he will get double points.' },
                    { name: '/plusdelete', value: 'Deletes a +1 of a user based on the provided index. The index of a +1 is displayed next to it when running /plusinfo.' },
                    { name: '/plusreset', value: 'Resets the whole +1 file.' },
                    { name: '/unlink', value: 'Unlinks a specified user from his Ingame-name.' },
                    { name: '!purge', value: 'Removes all roles from all tagged members.' },
                    { name: '/addpoints type', value: 'Adds X amount of +1s to a specific category and member.' },
                    { name: '!split amount members', value: 'Adds the specified amount to the mentioned members balances.' },
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        }
    }
};
