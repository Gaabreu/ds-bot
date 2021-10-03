const playFile = require('./play.js')


module.exports = {
    name: 'skip',
    description: 'Trocar de música',
    async execute(message, serverQueue, args, queue) {
        if (!message.member.voice.channel)
        return message.channel.send(
            "Tem que estar no canal pra passar a música!"
            );
            
            if (!serverQueue.songs[1])
            return message.channel.send("Não tem música pra eu pular!");
            
            serverQueue.songs.shift();
            playFile.play(message.guild, serverQueue.songs[0], queue)
        }
    }