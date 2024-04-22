const discord = require('discord.js');
const {GatewayIntentBits} = require('discord.js');
const client = new discord.Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]});
const config = require('./config.json');

async function refreshSpyPetBotIdsDatabase() {
    console.log('Refreshing bot IDs database...')
    //https://kickthespy.pet/idsより、spy.petのbotのid一覧を取得
    fetch('https://kickthespy.pet/ids')
        .then(res => res.json())
        .then(json => {
            //botのid一覧を取得
            const ids = json;
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
    },
    {
        name: 'invite',
        description: 'Get the invite link for this bot'
    },
    {
        name: 'ping',
        description: 'Get the bot\'s ping'
    },
    {
        name: 'list',
        description: 'List all known spy.pet bots'
    }
];

let botIds = []

client.on('ready', () => {
    console.log('Bot is ready');
    botIds = refreshSpyPetBotIdsDatabase();
    client.application.commands.set(slashCommands);
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
    else if (commandName === 'invite') {
        await interaction.reply('https://discord.com/api/oauth2/authorize?client_id=883258611215429130&permissions=4&scope=bot%20applications.commands');
    }
    else if (commandName === 'ping') {
        await interaction.reply(`Pong! ${client.ws.ping}ms`);
    }
    else if (commandName === 'list') {
        await interaction.reply({
            embeds: [
                {
                    title: 'Known spy.pet bots ids',
                    description: botIds.join('\n')
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