
module.exports = {
    name: 'disconnect',
    description: 'Desconectar do canal de voz',
    args: true,
    async execute(message) {
        if (!message.member.voice.channel)
            return message.channel.send(
                "Tem que estar no canal pra parar a música"
            );
                    
        message.member.voice.channel.leave();
    }
}