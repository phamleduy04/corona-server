const Discord = require('discord.js');

const client = new Discord.Client();

const { TOKEN } = require('./config.json');

client.login(TOKEN);

const serverStats = {
    guildID: '687490697393471543',
    memberCountID: '687500895973539870',
    botCountID: '687500925551509544'
};

client.on('ready', () => {
    client.user.setPresence({
        activity: {
            name: 'my members',
            type: 'WATCHING'
        },
        status: 'online'
    });
    console.log('Bot đã online!');
})

client.on('guildMemberAdd', (member) => {
    if (!member.user.bot) {
        const welcome_channel = client.channels.cache.get('687490697854713925');
        const chung_channel = client.channels.cache.get('687496447574540362');
        welcome_channel.send(`Xin chào ${member}, chào mừng bạn đến với **${member.guild.name}**`);
        chung_channel.send(`Bạn **${member.user.tag}** vừa vào server **${member.guild.name}**! Mọi người hãy chào mừng bạn ấy đi nào :)`)

        //Server stats
        if (member.guild.id == serverStats.guildID) {
            client.channels.cache.get(serverStats.memberCountID).setName(`Member Count: ${member.guild.members.cache.filter(m => !m.user.bot).size}`);
            client.channels.cache.get(serverStats.botCountID).setName(`Bot count: ${member.guild.members.cache.filter(m => m.user.bot).size}`);
        } else {
            return;
        }
    } else {
        const welcome_channel = client.channels.cache.get('687490697854713925');
        welcome_channel.send(`Bot ${member} vừa vào **${member.guild.name}**`);
        member.roles.add('687495677982539900');
    }
})
client.on('guildMemberRemove', (member) => {
    member.guild.channels.cache.get('687497724878389328').send(`**${member.user.tag}** đã vừa chim cút khỏi server!`);
    if (member.guild.id == serverStats.guildID) {
        client.channels.cache.get(serverStats.memberCountID).setName(`Member Count: ${member.guild.members.cache.filter(m => !m.user.bot).size}`);
        client.channels.cache.get(serverStats.botCountID).setName(`Bot count: ${member.guild.members.cache.filter(m => m.user.bot).size}`);
    } else {
        return;
    }
})