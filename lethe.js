var Discord = require('discord.js');

var ytdl = require('ytdl-core');
var request = require('request');
var url = require('url');

// Output version information in console
var git = require('git-rev');

git.short(commit => git.branch(branch => {
  console.log(`Lethe#${branch}@${commit}`);
}));

var shouldDisallowQueue = require('./lib/permission-checks.js');
var VideoFormat = require('./lib/video-format.js');
var YoutubeStream = require('./lib/youtube-stream.js');
var Saved = require('./lib/saved.js');
Saved.read();

var Config = require('./lib/config.js');

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
  botMention = `<@${client.user.id}>`;
  console.log(`Bot mention: ${botMention}`);
});

client.on('message', m => {
  if (!botMention) return;
  if (client.user.id == m.author.id) return;

  if (checkCommand(m, 'info') && m.content.startsWith(`${botMention} info`)) {
    git.short(commit => git.branch(branch => {
      client.reply(m, `Version: \`Lethe#${branch}@${commit}\`. Info about Lethe can be found at https://github.com/meew0/Lethe.`);
    }));
    return;
  }

  if (checkCommand(m, 'init') && m.content.startsWith(`${botMention} i`)) { // init
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

  if (checkCommand(m, 'destroy') && m.content.startsWith(`${botMention} d`)) { // destroy
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

  if (checkCommand(m, 'next') && m.content.startsWith(`${botMention} n`)) { // next
    playStopped();
  }

  if (checkCommand(m, 'yq') && m.content.startsWith(`${botMention} yq`) // youtube query
    || m.content.startsWith(`${botMention} qq`) // queue query
    || m.content.startsWith(`${botMention} pq`) // play query
    || m.content.startsWith(`${botMention} ytq`)) {

    if (apiKey == false) {
      client.reply(m, 'Search is disabled (no API KEY found).');
      return;
    }

    var args = spliceArguments(m.content)[1];

    if (!args) {
      client.reply(m, 'You need to specify a search parameter.');
      return;
    }

    var requestUrl = 'https://www.googleapis.com/youtube/v3/search' +
      `?part=snippet&q=${escape(args)}&key=${apiKey}`;

    request(requestUrl, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        if (body.items.length == 0) {
          client.reply(m, 'Your query gave 0 results.');
          return;
        }

        var vid = body.items[0].id.videoId;
        getInfoAndQueue(vid, m);
      } else {
        client.reply(m, 'There was an error searching.');
        return;
      }
    });

    return; // have to stop propagation
  }

  if (checkCommand(m, 'pl') && m.content.startsWith(`${botMention} pl`)) { // playlist
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
          var vid = elem.contentDetails.videoId;
          if (idx == 1) suppress = body.items.length - 2;
          if (idx == 2) suppress = -1;
          getInfoAndQueue(vid, m, suppress);
        });
      } else {
        client.reply(m, 'There was an error finding playlist with that id.');
        return;
      }
    });

    return;
  }

  if (checkCommand(m, 'yt') && m.content.startsWith(`${botMention} y`) // youtube
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

  if (checkCommand(m, 'replay') && m.content.startsWith(`${botMention} r`)) { // replay
    playQueue.push(currentVideo);
    client.reply(m, `Queued ${VideoFormat.prettyPrint(currentVideo)}`);
  }

  if (checkCommand(m, 'shuffle') && m.content.startsWith(`${botMention} sh`)) { // shuffle
    if (playQueue.length < 2) {
      client.reply(m, 'Not enough songs in the queue.');
      return;
    } else {
      shuffle(playQueue);
      client.reply(m, 'Songs in the queue have been shuffled.');
    }

    return;
  }

  if (checkCommand(m, 'link') && m.content.startsWith(`${botMention} link`)) {
    if (currentVideo) client.reply(m, `<${currentVideo.loaderUrl}>`);
    return; // stop propagation
  }

  if (checkCommand(m, 'list saved') && m.content.startsWith(`${botMention} list s`)) { // list saved
    var formattedList = 'Here are the videos currently saved: \n';
    for (var key in Saved.saved.videos) {
      if (Saved.saved.videos.hasOwnProperty(key)) {
        formattedList += `*${key}*: ${VideoFormat.prettyPrint(Saved.saved.videos[key])}\n`;
      }
    }

    client.reply(m, formattedList);
    return; // so list doesn't get triggered
  }

  if (checkCommand(m, 'list') && m.content.startsWith(`${botMention} l`)) { // list
    var formattedList = 'Here are the videos currently in the play queue, from first added to last added: \n';
    formattedList += `Currently playing: ${VideoFormat.prettyPrintWithUser(currentVideo)}\n`;

    var shouldBreak = false;

    playQueue.forEach((video, idx) => {
      if (shouldBreak) return;

      var formattedVideo = `${idx + 1}. ${VideoFormat.prettyPrintWithUser(video)}\n`;

      if ((formattedList.length + formattedVideo.length) > 1950) {
        formattedList += `... and ${playQueue.length - idx} more`;
        shouldBreak = true;
      } else {
        formattedList += formattedVideo;
      }
    });
    client.reply(m, formattedList);
  }

  if (checkCommand(m, 'save') && m.content.startsWith(`${botMention} s`)) { // save
    var argument = spliceArguments(m.content)[1];
    if (!argument) {
      client.reply(m, 'You need to specify a video and a keyword!');
      return;
    }

    var splitArgs = spliceArguments(argument, 1);

    var vid = splitArgs[0];

    if (vid === 'current') {
      if (currentVideo) vid = currentVideo.vid;
      else {
        client.reply(m, `Couldn't retrieve video information of current video!`);
      }
    }

    var requestUrl = 'http://www.youtube.com/watch?v=' + vid;
    ytdl.getInfo(requestUrl, (err, info) => {
      if (err) handleYTError(err);
      else saveVideo(info, vid, splitArgs[1], m);
    });
  }

  if (checkCommand(m, 'time') && m.content.startsWith(`${botMention} t`)) { // time
    var streamTime = client.internal.voiceConnection.streamTime; // in ms
    var videoTime = currentVideo.length_seconds;
    client.reply(m, `${VideoFormat.prettyTime(streamTime)} / ${VideoFormat.prettyTime(videoTime * 1000)} (${(streamTime / (videoTime * 10)).toFixed(2)} %)`);
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

  getInfoAndQueue(vid, m, suppress);
}

function getInfoAndQueue(vid, m, suppress) {
  requestUrl = 'http://www.youtube.com/watch?v=' + vid;
  ytdl.getInfo(requestUrl, (err, info) => {
    if (err) handleYTError(err);
    else {
      info.vid = vid;
      possiblyQueue(info, m.author.id, m, suppress);
    }
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

  var key;
  if (key = Saved.isVideoSaved(vid)) client.reply(m, `Warning: This video is already saved as *${key}*! Adding it anyway as *${keywords}*.`);

  Saved.saved.videos[keywords] = simplified;
  client.reply(m, `Saved video ${VideoFormat.prettyPrint(video)} as *${keywords}*`);
  Saved.write();
}

function possiblyQueue(video, userId, m, suppress) {
  video.userId = userId;
  suppress = (suppress === undefined) ? false : suppress;
  reason = shouldDisallowQueue(playQueue, video, Config);
  if (!userIsAdmin(userId) && reason) {
    client.reply(m, `You can't queue ${VideoFormat.simplePrint(video)} right now! Reason: ${reason}`);
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

    currentStream.on('error', (err) => {
      boundChannel.sendMessage(`There was an error during playback! **${err}**`);
    });

    currentStream.on('end', () => setTimeout(playStopped, Config.timeOffset || 8000)); // 8 second leeway for bad timing
    connection.playRawStream(currentStream).then(intent => {
      boundChannel.sendMessage(`Playing ${VideoFormat.prettyPrint(video)}`);
    });
  }
}

function userIsAdmin(user) {
  return Config.adminIds.indexOf(user.id) > -1;
}

function checkCommand(m, command) {
  if (Config.commandsRestrictedToAdmins[command]) {
    if (!userIsAdmin(m.author.id)) {
      client.reply(m, `You don't have permission to execute that command!`);
      return false;
    }
  }

  return true;
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
