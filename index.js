const discord = require('discord.js');
const client = new discord.Client();
const config = require('./config.json');

async function refreshSpyPetBotIdsDatabase() {
    console.log('Refreshing bot IDs database...')
    //https://kickthespy.pet/idsより、spy.petのbotのid一覧を取得
    fetch('https://kickthespy.pet/ids')
        .then(res => res.json())
        .then(json => {
            //botのid一覧を取得
            const ids = json.ids;
            //botのid一覧を表示
            console.log('Known bot IDs:')
            console.log(ids);
            return ids;
        });
}

const slashCommands = [
    {
        name: 'banbots',
        description: 'Ban all known spy.pet bots'
    },
    {
        name: 'help',
        description: 'Display help'
    }
];

let botIds = []

client.on('ready', () => {
    console.log('Bot is ready');
    botIds = refreshSpyPetBotIdsDatabase();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'banbots') {
        //botIdsに含まれるbotのidを持つメンバーをBANする
        interaction.guild.members.fetch().then(members => {
            members.forEach(member => {
                if (botIds.includes(member.id)) {
                    member.ban();
                }
            });
        });
        await interaction.reply('Banned all joined known spy.pet bots');
    }
    else if (commandName === 'help') {
        await interaction.reply({
            embeds: [
                {
                    title: 'Help',
                    description: 'This bot is designed to ban all known spy.pet bots from your server. To use this bot, you need to have the "Ban Members" permission.',
                    fields: [
                        {
                            name: 'Commands',
                            value: slashCommands.map(command => `/${command.name} - ${command.description}`).join('\n')
                        }
                    ]
                }
            ]
        });
    }
});

client.on('GuildMemberAdd', member => {
    if (botIds.includes(member.id)) {
        member.ban();
    }
});

client.login(config.token);