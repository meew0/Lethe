var Discord = require('discord.js');

var youtubeStream = require('youtube-audio-stream');
var ytdl = require('ytdl-core');

var shouldDisallowQueue = require('./lib/permission-checks.js');
var VideoFormat = require('./lib/video-format.js');

var Saved = require('./lib/saved.js');
Saved.read();

var client = new Discord.Client();

// Handle discord.js warnings
client.on('warn', (m) => console.log('[warn]', m));

var playQueue = [];
var boundChannel = false;
var currentStream = false;
var currentVideo = false;

var botMention = false;

client.on('ready', () => {
  botMention = `<@${client.internal.user.id}>`;
  console.log(`Bot mention: ${botMention}`);
});

client.on('message', m => {
  if (!botMention) return;

  if (m.content.startsWith(`${botMention} i`)) { // init
    if (boundChannel) return;
    var channelToJoin = spliceArguments(m.content)[1];
    for (var channel of m.channel.server.channels) {
      if (channel instanceof Discord.VoiceChannel) {
        if (!channelToJoin || channel.name === channelToJoin) {
          boundChannel = m.channel;
          client.reply(m, `Binding to text channel <#${boundChannel.id}> and voice channel **${channel.name}** \`(${channel.id})\``);
          client.joinVoiceChannel(channel).catch(error);
          break;
        }
      }
    }
  }

  if (m.content.startsWith(`${botMention} d`)) { // destroy
    if (!boundChannel) return;
    client.reply(m, `Unbinding from <#${boundChannel.id}> and destroying voice connection`);
    playQueue = [];
    if (currentStream) currentStream.destroy();
    client.internal.leaveVoiceChannel();
    boundChannel = false;
    currentStream = false;
    currentVideo = false;
    return;
  }

  // Only respond to other messages inside the bound channel
  if (!m.channel.equals(boundChannel)) return;

  if (m.content.startsWith(`${botMention} n`)) { // next
    if (playQueue.length > 0) {
      currentStream.destroy();
      playStopped();
    } else {
      client.reply(m, 'Cannot skip to the next video as the queue is empty!');
    }
  }

  if (m.content.startsWith(`${botMention} y`) // youtube
    || m.content.startsWith(`${botMention} q`) // queue
    || m.content.startsWith(`${botMention} p`)) { // play

    var vid = Saved.possiblyRetrieveVideo(spliceArguments(m.content)[1]);
    if (!vid) {
      client.reply(m, 'You need to specify a video!');
      return;
    }

    var requestUrl = 'http://www.youtube.com/watch?v=' + vid;
    ytdl.getInfo(requestUrl, (err, info) => {
      if (err) handleYTError(err);
      else possiblyQueue(info, m.author.id, m);
    });
  }

  if (m.content.startsWith(`${botMention} list s`)) { // list saved
    var formattedList = 'Here are the videos currently saved: \n';
    for (var key in Saved.saved.videos) {
      if (Saved.saved.videos.hasOwnProperty(key)) {
        formattedList += `*${key}*: ${VideoFormat.prettyPrint(Saved.saved.videos[key])}\n`;
      }
    }

    client.reply(m, formattedList);
    return; // so list doesn't get triggered
  }

  if (m.content.startsWith(`${botMention} l`)) { // list
    var formattedList = 'Here are the videos currently in the play queue, from first added to last added: \n';
    formattedList += `Currently playing: ${VideoFormat.prettyPrintWithUser(currentVideo)}\n`;
    playQueue.forEach((video, idx) => {
      formattedList += `${idx + 1}. ${VideoFormat.prettyPrintWithUser(video)}\n`;
    });
    client.reply(m, formattedList);
  }

  if (m.content.startsWith(`${botMention} s`)) { // save
    var argument = spliceArguments(m.content)[1];
    if (!argument) {
      client.reply(m, 'You need to specify a video and a keyword!');
      return;
    }

    var splitArgs = spliceArguments(argument, 1);
    var requestUrl = 'http://www.youtube.com/watch?v=' + splitArgs[0];
    ytdl.getInfo(requestUrl, (err, info) => {
      if (err) handleYTError(err);
      else saveVideo(info, splitArgs[1], m);
    });
  }

  if (m.content.startsWith(`${botMention} t`)) { // time
    var streamTime = client.internal.voiceConnection.streamTime; // in ms
    var videoTime = currentVideo.length_seconds;
    client.reply(m, `${VideoFormat.prettyTime(streamTime)} / ${VideoFormat.prettyTime(videoTime * 1000)} (${streamTime / (videoTime * 1000)} %)`);
  }
});

function spliceArguments(message, after) {
  after = after || 2;
  var rest = message.split(' ');
  var removed = rest.splice(0, after);
  return [removed.join(' '), rest.join(' ')];
}

function saveVideo(video, keywords, m) {
  simplified = VideoFormat.simplify(video);
  if (Saved.saved.videos.hasOwnProperty(keywords)) client.reply(m, `Warning: ${simplePrint(Saved.saved.videos[keywords])} is already saved as *${keywords}*! Overwriting.`);
  Saved.saved.videos[keywords] = simplified;
  client.reply(m, `Saved video ${VideoFormat.prettyPrint(video)} as *${keywords}*`);
  Saved.write();
}

function possiblyQueue(video, userId, m) {
  video.userId = userId;
  reason = shouldDisallowQueue(playQueue, video);
  if (reason) {
    client.reply(m, `You can't queue this video right now! Reason: ${reason}`);
  } else {
    playQueue.push(video);
    client.reply(m, `Queued ${VideoFormat.prettyPrint(video)}`);

    // Start playing if not playing yet
    if (!currentVideo) nextInQueue();
  }
}

function handleYTError(err) {
  if (err.toString().indexOf('Code 150') > -1) {
    // Video unavailable in country
    client.sendMessage(boundChannel, 'This video is unavailable in the country the bot is running in! Please try a different video.');
  } else {
    client.sendMessage(boundChannel, 'An error occurred while getting video information! Please try a different video.');
  }

  console.log(err.toString());
}

function playStopped() {
  if (client.internal.voiceConnection) client.internal.voiceConnection.stopPlaying();

  client.sendMessage(boundChannel, `Finished playing ${VideoFormat.simplePrint(currentVideo)}`);
  currentVideo = false;
  nextInQueue();
}

function play(video) {
  currentVideo = video;
  if (client.internal.voiceConnection) {
    var connection = client.internal.voiceConnection;
    currentStream = youtubeStream(video.loaderUrl);
    currentStream.on('end', () => setTimeout(playStopped, 8000)); // 8 second leeway for bad timing
    connection.playRawStream(currentStream).then(intent => {
      client.sendMessage(boundChannel, `Playing ${VideoFormat.prettyPrint(video)}`);
    });
  }
}

function nextInQueue() {
  if (playQueue.length > 0) {
    next = playQueue.shift();
    play(next);
  }
}

function error(argument) {
  console.log(argument.stack);
}

// Email and password over command line
client.login(process.argv[2], process.argv[3]).catch((e) => console.log(e));
