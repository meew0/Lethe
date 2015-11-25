var Discord = require('discord.js');

var ytdl = require('ytdl-core');
var request = require('request');
var url = require('url');

var shouldDisallowQueue = require('./lib/permission-checks.js');
var VideoFormat = require('./lib/video-format.js');
var YoutubeStream = require('./lib/youtube-stream.js');
var Saved = require('./lib/saved.js');
Saved.read();

var client = new Discord.Client();

// Handle discord.js warnings
client.on('warn', (m) => console.log('[warn]', m));
client.on('debug', (m) => console.log('[debug]', m));

var playQueue = [];
var boundChannel = false;
var currentStream = false;
var currentVideo = false;

var botMention = false;

// Handling api key
if (process.argv[4]) {
  var apiKey = process.argv[4];
} else {
  var apiKey = false;
}

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
    client.internal.leaveVoiceChannel();
    boundChannel = false;
    currentStream = false;
    currentVideo = false;
    return;
  }

  // Only respond to other messages inside the bound channel
  if (!m.channel.equals(boundChannel)) return;

  if (m.content.startsWith(`${botMention} n`)) { // next
    playStopped();
  }

  if (m.content.startsWith(`${botMention} yq`) // youtube query
    || m.content.startsWith(`${botMention} qq`) // queue query
    || m.content.startsWith(`${botMention} pq`) // play query
    || m.content.startsWith(`${botMention} ytq`)) {

    if (apiKey == false) {
      client.reply(m, 'Search is disabled (no API KEY found).');
      return;
    }

    var q = '';
    var args = spliceArguments(m.content);

    for (var i = 1; i < args.length; i++) {
      q += args[i];
    }

    if (!q) {
      client.reply(m, 'You need to specify a search parameter.');
      return;
    }

    var requestUrl = 'https://www.googleapis.com/youtube/v3/search' +
      '?part=snippet&q=' + escape(q) + '&key=' + apiKey;

    request(requestUrl, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        if (body.items.length == 0) {
          client.reply(m, 'Your query gave 0 results.');
          return;
        }

        requestUrl = 'http://www.youtube.com/watch?v=' + body.items[0].id.videoId;
        ytdl.getInfo(requestUrl, (err, info) => {
          if (err) handleYTError(err);
          else possiblyQueue(info, m.author.id, m);
        });
      } else {
        client.reply(m, 'There was an error searching.');
        return;
      }
    });

    return; // have to stop propagation
  }

  if (m.content.startsWith(`${botMention} pl`)) { // playlist
    if (apiKey == false) {
      client.reply(m, 'Playlist adding is disabled (no API KEY found).');
      return;
    }

    var pid = spliceArguments(m.content)[1];

    if (!pid) {
      client.reply(m, 'You need to specify a playlist ID!');
      return;
    }

    var requestUrl = 'https://www.googleapis.com/youtube/v3/playlistItems' +
      `?part=contentDetails&maxResults=50&playlistId=${pid}&key=${apiKey}`;

    request(requestUrl, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        if (body.items.length == 0) {
          client.reply(m, 'That playlist has no videos.');
          return;
        }

        client.reply(m, `Loading ${body.items.length} videos...`);
        var suppress = 0;
        body.items.forEach((elem, idx) => {
          requestUrl = 'http://www.youtube.com/watch?v=' +
            elem.contentDetails.videoId;
          ytdl.getInfo(requestUrl, (err, info) => {
            if (err) handleYTError(err);
            else {
              if (idx == 1) suppress = body.items.length - 2;
              if (idx == 2) suppress = -1;
              possiblyQueue(info, m.author.id, m, suppress);
            }
          });
        });
      } else {
        client.reply(m, 'There was an error finding playlist with that id.');
        return;
      }
    });

    return;
  }

  if (m.content.startsWith(`${botMention} y`) // youtube
    || m.content.startsWith(`${botMention} q`) // queue
    || m.content.startsWith(`${botMention} p`)) { // play

    var vidList = spliceArguments(m.content)[1];

    var vids = vidList.split(',');
    var suppress = 0;
    vids.forEach((vid, idx) => {
      if (idx == 1) suppress = vids.length - 2;
      if (idx == 2) suppress = -1;
      parseVidAndQueue(vid, m, suppress);
    });
  }

  if (m.content.startsWith(`${botMention} sh`) ||
      m.content.startsWith(`${botMention} shuffle`)) { // list saved

    if (playQueue.length < 2) {
      client.reply(m, 'Not enough songs in the queue.');
      return;
    } else {
      shuffle(playQueue);
      client.reply(m, 'Songs in the queue have been shuffled.');
    }

    return;
  }

  if (m.content.startsWith(`${botMention} link`)) {
    if (currentVideo) client.reply(m, `<${currentVideo.loaderUrl}>`);
    return; // stop propagation
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
      else saveVideo(info, splitArgs[0], splitArgs[1], m);
    });
  }

  if (m.content.startsWith(`${botMention} t`)) { // time
    var streamTime = client.internal.voiceConnection.streamTime; // in ms
    var videoTime = currentVideo.length_seconds;
    client.reply(m, `${VideoFormat.prettyTime(streamTime)} / ${VideoFormat.prettyTime(videoTime * 1000)} (${(streamTime / (videoTime * 1000)).toFixed(2)} %)`);
  }
});

function parseVidAndQueue(vid, m, suppress) {
  if (/^http/.test(vid)) {
    if (url.parse(vid, true).query.v) {
      vid = url.parse(vid, true).query.v;
    }
  }

  vid = Saved.possiblyRetrieveVideo(vid);
  if (!vid) {
    client.reply(m, 'You need to specify a video!');
    return;
  }

  var requestUrl = 'http://www.youtube.com/watch?v=' + vid;
  ytdl.getInfo(requestUrl, (err, info) => {
    if (err) handleYTError(err);
    else possiblyQueue(info, m.author.id, m, suppress);
  });
}

function spliceArguments(message, after) {
  after = after || 2;
  var rest = message.split(' ');
  var removed = rest.splice(0, after);
  return [removed.join(' '), rest.join(' ')];
}

function saveVideo(video, vid, keywords, m) {
  simplified = VideoFormat.simplify(video, vid);
  if (Saved.saved.videos.hasOwnProperty(keywords)) client.reply(m, `Warning: ${VideoFormat.simplePrint(Saved.saved.videos[keywords])} is already saved as *${keywords}*! Overwriting.`);
  Saved.saved.videos[keywords] = simplified;
  client.reply(m, `Saved video ${VideoFormat.prettyPrint(video)} as *${keywords}*`);
  Saved.write();
}

function possiblyQueue(video, userId, m, suppress) {
  video.userId = userId;
  suppress = (suppress === undefined) ? false : suppress;
  reason = shouldDisallowQueue(playQueue, video);
  if (reason) {
    client.reply(m, `You can't queue this video right now! Reason: ${reason}`);
  } else {
    playQueue.push(video);
    if (suppress == 0) client.reply(m, `Queued ${VideoFormat.prettyPrint(video)}`);
    else if (suppress > -1) client.reply(m, `Queued ${VideoFormat.prettyPrint(video)} and ${suppress} other videos`);

    // Start playing if not playing yet
    if (!currentVideo) nextInQueue();
  }
}

function handleYTError(err) {
  if (err.toString().indexOf('Code 150') > -1) {
    // Video unavailable in country
    boundChannel.sendMessage('This video is unavailable in the country the bot is running in! Please try a different video.');
  } else {
    boundChannel.sendMessage('An error occurred while getting video information! Please try a different video.');
  }

  console.log(err.toString());
}

function playStopped() {
  if (client.internal.voiceConnection) client.internal.voiceConnection.stopPlaying();

  boundChannel.sendMessage(`Finished playing ${VideoFormat.simplePrint(currentVideo)}`);
  currentVideo = false;
  nextInQueue();
}

function play(video) {
  currentVideo = video;
  if (client.internal.voiceConnection) {
    var connection = client.internal.voiceConnection;
    currentStream = YoutubeStream.getStream(video.loaderUrl);
    currentStream.on('end', () => setTimeout(playStopped, 8000)); // 8 second leeway for bad timing
    connection.playRawStream(currentStream).then(intent => {
      boundChannel.sendMessage(`Playing ${VideoFormat.prettyPrint(video)}`);
    });
  }
}

function nextInQueue() {
  if (playQueue.length > 0) {
    next = playQueue.shift();
    play(next);
  }
}

function shuffle(array) {
  var counter = array.length;
  var temp;
  var index;

  // While there are elements in the array
  while (counter > 0) {
    index = Math.floor(Math.random() * counter);

    counter--;

    temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

function error(argument) {
  console.log(argument.stack);
}

// Email and password over command line
client.login(process.argv[2], process.argv[3]).catch((e) => console.log(e));
