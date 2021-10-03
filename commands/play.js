const ytdl = require("ytdl-core");
const yts = require("yt-search");
const Discord = require('discord.js');

module.exports = {
    name: 'play',
    description: 'Tocar musica no canal',
    async execute(message, serverQueue, args, queue) {

        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel)
        return message.channel.send(
            "Você precisa estar em um canal para tocar música, filho da puta!"
            );
            
            const permissions = voiceChannel.permissionsFor(message.client.user);
            
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return message.channel.send(
                    "Preciso de permissões para entrar e falar no seu canal!"
                    );
                }
                
                let song;
                if (ytdl.validateURL(args)) {
                    const songInfo = await ytdl.getInfo(args);
                    song = {
                        title: songInfo.videoDetails.title,
                        url: songInfo.videoDetails.video_url
                    };
                } else {
                    const {videos} = await yts(args.slice().join(" "));
                    if (!videos.length) return message.channel.send("Não quis procurar direito (Não achei)");
                    song = {
                        title: videos[0].title,
                        url: videos[0].url
                    };
                }
                if (!serverQueue) {
                    const queueConstruct = {
                        textChannel: message.channel,
                        voiceChannel: voiceChannel,
                        connection: null,
                        songs: [],
                        volume: 5,
                        playing: true
                    };
                    //ADICIONA NA QUEUE

                    queue.set(message.guild.id, queueConstruct);
                    queueConstruct.songs.push(song);
                    
                    try {
                        var connection = await voiceChannel.join();
                        queueConstruct.connection = connection;
                        this.play(message.guild, queueConstruct.songs[0], queue);
                        
                    } catch (err) {
                        queue.delete(message.guild.id);
                        return message.channel.send(err);
                    }
                } else {
                    serverQueue.songs.push(song);
                    return message.channel.send(`**${song.title}** adicionada na fila!`);
                }
            },

            play(guild, song, queue) {

                const serverQueue = queue.get(guild.id);

                if (!song) {
                    serverQueue.voiceChannel.leave();
                    return;
                }  

                const dispatcher = serverQueue.connection
                .play(ytdl(song.url))
                .on("finish", () => {
                    console.log("GUILD",guild)
                    serverQueue.songs.shift();
                    this.play(guild, serverQueue.songs[0], queue);
                })
                .on("error", error => console.error(error));
                dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
                
                const embed = new Discord.MessageEmbed()
                .setColor('#32a852')
                .setTitle('Tocando a mais cringe')
                .addFields(
                    { name: song.title, value: song.url }
                )
                .setTimestamp()
                .setImage('https://i.kym-cdn.com/photos/images/newsfeed/002/111/316/c57.gif')

                serverQueue.textChannel.send(embed);
            }
            
        };