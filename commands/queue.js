
const Discord = require('discord.js');

module.exports = {
    name: 'queue',
    description: 'Mostrar as músicas na fila',
    args: true,

    async execute(message, serverQueue, args, queue) {
        const musicas = serverQueue.songs
        let posicoes = []

        musicas.forEach(musica => {
            posicoes.push(musica.title)
        });

        const embed = new Discord.MessageEmbed()
        .setColor('#3458eb')
        .setTitle('Mostrando a fila mais cringe')
        .addFields(
            { name: posicoes, value: '--TERMINA AQUI' }
        )

        message.channel.send(embed)
    }
}