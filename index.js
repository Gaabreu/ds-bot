const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const client = new Discord.Client();
const queue = new Map();


client.once("ready", () => {
    console.log("Ready!");
});

client.once("reconnecting", () => {
    console.log("Reconnecting!");
});

client.once("disconnect", () => {
    console.log("Disconnect!");
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // check if someone connects or disconnects
    if (oldState.channelID === null || typeof oldState.channelID == 'undefined') return;
    // check if the bot is disconnecting
    if (newState.id !== client.user.id) return;
    // clear the queue
    return queue.delete(oldState.guild.id);
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    
    const serverQueue = queue.get(message.guild.id);
    
    if (message.content.startsWith(`${prefix}play`) || message.content.startsWith(`${prefix}p`)) {
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`) || message.content.startsWith(`${prefix}sk`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`) || message.content.startsWith(`${prefix}st`)) {
        stop(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}disconnect`)) {
        disconnect(message)
    } else if(message.content.startsWith(`${prefix}queue`)){
        queueList(message, serverQueue);
    }else {
        message.channel.send("Manda um comando válido, arrombado!");
    }
});

async function execute(message, serverQueue) {
    
    const args = message.content.split(" ");
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
            if (ytdl.validateURL(args[1])) {
                const songInfo = await ytdl.getInfo(args[1]);
                song = {
                    title: songInfo.videoDetails.title,
                    url: songInfo.videoDetails.video_url
                };
            } else {
                const {videos} = await yts(args.slice(1).join(" "));
                if (!videos.length) return message.channel.send("Não quis procurar direito (Não achei)");
                song = {
                    title: videos[0].title,
                    url: videos[0].url
                };
            }
            if (!serverQueue) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    volume: 5,
                    playing: true
                };
                queue.set(message.guild.id, queueContruct);
                queueContruct.songs.push(song);
                try {
                    var connection = await voiceChannel.join();
                    queueContruct.connection = connection;
                    play(message.guild, queueContruct.songs[0]);
                    
                } catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(err);
                }
            } else {
                serverQueue.songs.push(song);
                return message.channel.send(`**${song.title}** adicionada na fila!`);
            }
        }
        
        function skip(message, serverQueue) {
            if (!message.member.voice.channel)
            return message.channel.send(
                "Tem que estar no canal pra passar a música!"
                );
                
                if (!serverQueue.songs[1])
                return message.channel.send("Não tem música pra eu pular!");
                
                serverQueue.songs.shift();
                play(message.guild, serverQueue.songs[0])
            }
            
            function stop(message, serverQueue) {
                if (!message.member.voice.channel)
                return message.channel.send(
                    "Tem que estar no canal pra parar a música"
                    );
                    
                    if (!serverQueue)
                    return message.channel.send("Tem musica tocando não zé!");
                    
                    serverQueue.songs = [];
                    serverQueue.connection.dispatcher.end();
                }
                
                function play(guild, song) {
                    const serverQueue = queue.get(guild.id);
                    if (!song) {
                        serverQueue.voiceChannel.leave();
                        queue.delete(guild.id);
                        return;
                    }  
                    const dispatcher = serverQueue.connection
                    .play(ytdl(song.url))
                    .on("finish", () => {
                        serverQueue.songs.shift();
                        play(guild, serverQueue.songs[0]);
                    })
                    .on("error", error => console.error(error));
                    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
                    serverQueue.textChannel.send(`Tocando a mais cringe: **${song.title}**`);
                }
                
                function disconnect(message) {
                    message.member.voice.channel.leave();
                }
                
                function queueList(message, serverQueue) {
                    const musicas = serverQueue.songs
                    let posicao = 1
                    musicas.forEach(musica => {
                        message.channel.send(posicao +"- " + `**${musica.title}**`);
                        posicao++;
                    });
                }

                client.login(token);