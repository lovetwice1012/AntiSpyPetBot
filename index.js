const discord = require('discord.js');
const {GatewayIntentBits,ActivityType,PermissionsBitField } = require('discord.js');
const client = new discord.Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]});
const config = require('./config.json');

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});
process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

async function refreshSpyPetBotIdsDatabase() {
    return new Promise((resolve, reject) => {
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
            resolve(ids);
        });
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

botIds = []

client.on('ready', async () => {
    console.log('Bot is ready');
    botIds = require("./spypetbot.json").list
    client.application.commands.set(slashCommands);
    /*
    setInterval(async () => {
        botIds = await refreshSpyPetBotIdsDatabase();
    }, 1000 * 60);
    */
    client.user.setPresence({ activities: [{ name: `on ${client.guilds.cache.size} servers | watching ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} members | and I know ${botIds.length} Spy.Pet Bots`,  type:ActivityType.Watching }] , status:'online' });
    setInterval(async () => {
        client.user.setPresence({ activities: [{ name: `on ${client.guilds.cache.size} servers | watching ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} members | and I know ${botIds.length} Spy.Pet Bots(List Updated at ${require("./spypetbot.json").lastUpdate})`,  type:ActivityType.Watching }] , status:'online'});
    }, 1000 * 20);
});

client.on('interactionCreate', async interaction => {
    await interaction.deferReply();
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'banbots') {
        //botIdsに含まれるbotのidを持つメンバーをBANする
        let flag = false;
        interaction.guild.members.fetch().then(async members => {
            let embeds = [];
            members.forEach(member => {
                if (botIds.includes(member.id)) {
                    embeds.push({
                        title: 'Warning',
                        description: `Found a spy.pet bot[<@${member.id}>(${member.id})] in the server.`,
                        color: 0xff0000
                    })
                    flag = true;
                }
            });
            if(embeds.length > 0){
                for(let i = 0; i < embeds.length % 10; i++){
                    await interaction.followUp({embeds:embeds.slice(i*10, (i+1)*10)});
                }
            }
            if(!flag) await interaction.followUp('No spy.pet bots were found in the server\nstart banning all known spy.pet bots');
            //check if the bot has the permission to ban members
            if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)){
                await interaction.followUp('I don\'t have the "Ban Members" permission');
                return;
            }
            botIds.forEach(async id => {
                await interaction.guild.bans.create(id, { reason: 'Known spy.pet bot'});
            });
            await interaction.followUp('Banned all known spy.pet bots');
            if(!flag) return;
            interaction.channel.send({embeds:[{
                title: 'Warning',
                description: 'Spy.pet bots were found, it means that the attacker has obtained your server\'s invite link. It is strongly recommended to revoke all invite links and recreate them.',
                color: 0xff0000
            }]})
            
        });
        
    }
    else if (commandName === 'help') {
        await interaction.followUp({
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
        await interaction.followUp('https://discord.com/api/oauth2/authorize?client_id=883258611215429130&permissions=4&scope=bot%20applications.commands');
    }
    else if (commandName === 'ping') {
        await interaction.followUp(`Pong! ${client.ws.ping}ms`);
    }
    else if (commandName === 'list') {
        await interaction.followUp({
            embeds: [
                {
                    title: 'Known spy.pet bots ids',
                    description: botIds.join('\n')
                }
            ]
        });
    }
});

client.on('GuildMemberAdd',async  member => {
    if (botIds.includes(member.id)) {
        let cantBan = false;
        if(!member.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)){
            cantBan = true;
            return;
        }
        member.guild.systemChannel.send({embeds:[{
            title: 'Warning',
            description: cantBan ? `I found a spy.pet bot[<@${member.id}>(${member.id})] in your server,\n but I don't have the "Ban Members" permission. \nAutomatically banning the bot is not possible. Please ban the bot manually.` : `[WARNING] I found a spy.pet bot[<@${member.id}>(${member.id})] in your server. \nTrying to automatically banning the bot...`,
            color: 0xff0000
        }]})
        if(cantBan) return;
        member.ban({ reason: '[WARNING] Known spy.pet bot'}).then(() => {
            member.guild.systemChannel.send({embeds:[{
                title: 'Banned',
                description: `Banned spy.pet bot[<@${member.id}>(${member.id})]`,
                color: 0xff0000
            }]})
        }).catch(() => {
            member.guild.systemChannel.send({embeds:[{
                title: 'Failed to ban',
                description: `Failed to ban spy.pet bot[<@${member.id}>(${member.id})]`,
                color: 0xff0000
            }]})
        });
    }
});

client.login(config.token);