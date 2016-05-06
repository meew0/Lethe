var Discord = require('discord.js');

var ytdl = require('ytdl-core');
var request = require('superagent');
var url = require('url');

// Output version information in console
var git = require('git-rev');

git.short(commit => git.branch(branch => {
  console.log(`Lethe#${branch}@${commit}`);
}));

var shouldDisallowQueue = require('./lib/permission-checks.js');
var Saved = require('./lib/saved.js');
Saved.read();

var YoutubeTrack = require('./lib/youtube-track.js');

var Util = require('./lib/util.js');
var Config = require('./lib/config.js');
var CURRENT_REV = 4;

var client = new Discord.Client();

// Handle discord.js warnings
client.on('warn', (m) => console.log('[warn]', m));
client.on('debug', (m) => console.log('[debug]', m));

var playQueue = [];
var boundChannel = false;
var currentStream = false;

// Video that is currently being played
var currentVideo = false;

// Last video played
var lastVideo = false;

var botMention = false;

var shouldStockpile = false;
var stockpile = '';

// Handling api key
var apiKey = false;

if (process.argv[4]) {
  apiKey = process.argv[4];
} else if (Config.auth.apiKey !== 'youtube API key (optional)') {
  apiKey = Config.auth.apiKey;
}

client.on('ready', () => {
  botMention = `<@${client.user.id}>`;
  console.log(`Bot mention: ${botMention}`);
  if (Config.configRev !== CURRENT_REV) {
    console.log('WARNING: Your lethe-config.json is out of date relative to the code using it! Please update it from the git repository, otherwise things will break!');
  }
});

client.on('message', m => {
  if (!botMention) return;
  if (client.user.id == m.author.id) return;

  if (!m.content.startsWith(`${botMention} `) || m.content.length <= botMention.length + 1) return;

  if (m.content.startsWith(`${botMention} info`)) {
    if (!checkCommand(m, 'info')) return;
    git.short(commit => git.branch(branch => {
      client.reply(m, `Version: \`Lethe#${branch}@${commit}\` (cf: ${Config.configRev} cr: ${CURRENT_REV}). Info about Lethe can be found at https://github.com/meew0/Lethe.`);
    }));
    return;
  }

  if (m.content.startsWith(`${botMention} h`)) { // help
    if (!checkCommand(m, 'help')) return;

    if (Config.shouldUsePMs) {
      client.sendMessage(m.author,
         `Here are the commands I support:
          **Queue a video:** yt [video ID/URL]
          **List videos in queue:** list
          **Create a shortcut:** save [video ID/URL] [shortcut name]
          **Queue a playlist:** pl [playlist ID/URL]
          **Shuffle queue:** shuffle
          **Skip current video:** next
          **Get YouTube URL:** link
          **Get current playback time:** time
          **Replay Video:** replay
          **Search YouTube:** yq [search term]`
      ).then(msg => {
        client.reply(m, `I\'ve sent you my commands in PM`);
      });
    } else {
      client.reply(m, 'Usage info can be found here: https://github.com/meew0/Lethe/wiki/Usage');
    }

    return;
  }

  if (m.content.startsWith(`${botMention} i`)) { // init
    if (!checkCommand(m, 'init')) return;
    if (boundChannel) return;
    var userChannel = m.author.voiceChannel;
    var channelToJoin = spliceArguments(m.content)[1];
    for (var channel of m.channel.server.channels) {
      if (channel instanceof Discord.VoiceChannel) {
        if (!channelToJoin) {
          boundChannel = m.channel;
          if (userChannel) {
            client.reply(m, `Binding to text channel <#${boundChannel.id}> and voice channel **${userChannel.name}** \`(${userChannel.id})\``);
            client.joinVoiceChannel(userChannel).catch(error);
          } else {
            client.reply(m, `Binding to text channel <#${boundChannel.id}> and voice channel **${channel.name}** \`(${channel.id})\``);
            client.joinVoiceChannel(channel).catch(error);
          }

          break;
        } else if (channel.name === channelToJoin) {
          boundChannel = m.channel;
          client.reply(m, `Binding to text channel <#${boundChannel.id}> and voice channel **${channel.name}** \`(${channel.id})\``);
          client.joinVoiceChannel(channel).catch(error);
          break;
        }
      }
    }

    return;
  }

  if (m.content.startsWith(`${botMention} d`)) { // destroy
    if (!checkCommand(m, 'destroy')) return;
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
    if (!checkCommand(m, 'next')) return;
    if (currentVideo) {
      playStopped();
    } else {
      client.reply(m, 'No video is currently playing.');
    }

    return;
  }

  if (m.content.startsWith(`${botMention} yq`) // youtube query
    || m.content.startsWith(`${botMention} qq`) // queue query
    || m.content.startsWith(`${botMention} pq`) // play query
    || m.content.startsWith(`${botMention} ytq`)) {

    if (!checkCommand(m, 'yq')) return;

    if (!apiKey) {
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

    request(requestUrl, (error, response) => {
      if (!error && response.statusCode == 200) {
        var body = response.body;
        if (body.items.length == 0) {
          client.reply(m, 'Your query gave 0 results.');
          return;
        }

        for (var item of body.items) {
          if (item.id.kind === 'youtube#video') {
            var vid = item.id.videoId;
            getInfoAndQueue(vid, m);
            return;
          }
        }

        client.reply(m, 'No video has been found!');
      } else {
        client.reply(m, 'There was an error searching.');
        return;
      }
    });

    return; // have to stop propagation
  }

  if (m.content.startsWith(`${botMention} pl`)) { // playlist
    if (!checkCommand(m, 'pl')) return;

    if (!apiKey) {
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

    request.get(requestUrl).end((error, response) => {
      if (!error && response.statusCode == 200) {
        var body = response.body;
        if (body.items.length == 0) {
          client.reply(m, 'That playlist has no videos.');
          return;
        }

        shouldStockpile = true;
        fancyReply(m, `Loading ${body.items.length} videos...`);
        var suppress = 0;
        body.items.forEach((elem, idx) => {
          var vid = elem.contentDetails.videoId;
          if (idx == 1) suppress = body.items.length - 2;
          if (idx == 2) suppress = -1;
          getInfoAndQueue(vid, m, suppress);
        });
        spitUp();
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

    if (!checkCommand(m, 'yt')) return;

    var vidList = spliceArguments(m.content)[1];

    var vids = vidList.split(',');
    var suppress = 0;
    vids.forEach((vid, idx) => {
      if (idx == 1) suppress = vids.length - 2;
      if (idx == 2) suppress = -1;
      parseVidAndQueue(vid, m, suppress);
    });
    return;
  }

  if (m.content.startsWith(`${botMention} r`)) { // replay
    if (!checkCommand(m, 'replay')) return;
    var videoToPlay = currentVideo ? currentVideo : lastVideo ? lastVideo : false;
    if (!videoToPlay) {
      client.reply(m, 'No video has been played yet!');
      return;
    }

    playQueue.push(videoToPlay);
    client.reply(m, `Queued ${videoToPlay.prettyPrint()}`);
    return;
  }

  if (m.content.startsWith(`${botMention} sh`)) { // shuffle
    if (!checkCommand(m, 'shuffle')) return;
    if (playQueue.length < 2) {
      client.reply(m, 'Not enough songs in the queue.');
      return;
    } else {
      Util.shuffle(playQueue);
      client.reply(m, 'Songs in the queue have been shuffled.');
    }

    return;
  }

  if (m.content.startsWith(`${botMention} link`)) {
    if (!checkCommand(m, 'link')) return;
    if (currentVideo) client.reply(m, `<https://youtu.be/${currentVideo.vid}>`);
    return; // stop propagation
  }

  if (m.content.startsWith(`${botMention} list s`)) { // list saved
    if (!checkCommand(m, 'list saved')) return;
    var formattedList = 'Here are the videos currently saved: \n';
    for (var key in Saved.saved.videos) {
      if (Saved.saved.videos.hasOwnProperty(key)) {
        formattedList += `*${key}*: ${Saved.saved.videos[key].prettyPrint()}\n`;
      }
    }

    if (formattedList.length >= 2000) {
      Util.haste(formattedList, (key) => {
        if (!key) {
          client.reply(m, 'There was an error while retrieving the list of saved videos! Sorry :(');
        } else {
          client.reply(m, `http://hastebin.com/${key}.md`);
        }
      });
    } else client.reply(m, formattedList);
    return; // so list doesn't get triggered
  }

  if (m.content.startsWith(`${botMention} l`)) { // list
    if (!checkCommand(m, 'list')) return;

    var formattedList = '';
    var overallTime = 0;
    if (currentVideo) {
      formattedList += `Currently playing: ${currentVideo.fullPrint()}\n`;
      overallTime = Number(currentVideo.getTime());
    }

    if (playQueue.length == 0) {
      formattedList += `The play queue is empty! Add something using **${botMention} yt *<video ID>***.`;
    } else {
      formattedList += 'Here are the videos currently in the play queue, from first added to last added: \n';

      var shouldBreak = false;

      playQueue.forEach((video, idx) => {
        overallTime = Number(overallTime) + Number(video.getTime());
        if (shouldBreak) return;

        var formattedVideo = `${idx + 1}. ${video.fullPrint()}\n`;

        if ((formattedList.length + formattedVideo.length) > 1920) {
          formattedList += `... and ${playQueue.length - idx} more`;
          shouldBreak = true;
        } else {
          formattedList += formattedVideo;
        }
      });
      formattedList += `\n**Remaining play time:** ${Util.formatTime(overallTime)} minutes.`;
    }

    client.reply(m, formattedList);
    return;
  }

  if (m.content.startsWith(`${botMention} s`)) { // save
    if (!checkCommand(m, 'save')) return;
    var argument = spliceArguments(m.content)[1];
    if (!argument) {
      client.reply(m, 'You need to specify a video and a keyword!');
      return;
    }

    var splitArgs = spliceArguments(argument, 1);

    var vid = splitArgs[0];
    vid = resolveVid(vid, m);

    YoutubeTrack.getInfoFromVid(vid, m, (err, info) => {
      if (err) handleYTError(err);
      else saveVideo(info, vid, splitArgs[1], m);
    });
    return;
  }

  if (m.content.startsWith(`${botMention} t`)) { // time
    if (!checkCommand(m, 'time')) return;
    var streamTime = client.internal.voiceConnection.streamTime; // in ms
    var streamSeconds = streamTime / 1000;
    var videoTime = currentVideo.lengthSeconds;
    client.reply(m, `${Util.formatTime(streamSeconds)} / ${Util.formatTime(videoTime)} (${((streamSeconds * 100) / videoTime).toFixed(2)} %)`);
    return;
  }
});

function parseVidAndQueue(vid, m, suppress) {
  vid = resolveVid(vid, m);
  if (!vid) {
    client.reply(m, 'You need to specify a video!');
    return;
  }

  getInfoAndQueue(vid, m, suppress);
}

function resolveVid(thing, m) {
  thing = thing.trim();
  if (thing === 'current') {
    if (currentVideo) return currentVideo.vid;
    client.reply(m, 'No video currently playing!'); return false;
  } else if (thing === 'last') {
    if (lastVideo) return lastVideo.vid;
    client.reply(m, 'No last played video found!'); return false;
  } else if (/^http/.test(thing)) {
    var parsed = url.parse(thing, true);
    if (parsed.query.v) return parsed.query.v;
    client.reply(m, 'Not a YouTube URL!'); return false;
  } else return Saved.possiblyRetrieveVideo(thing);
}

function getInfoAndQueue(vid, m, suppress) {
  YoutubeTrack.getInfoFromVid(vid, m, (err, video) => {
    if (err) handleYTError(err);
    else {
      possiblyQueue(video, m.author.id, m, suppress);
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
  simplified = video.saveable();
  if (Saved.saved.videos.hasOwnProperty(keywords)) client.reply(m, `Warning: ${Saved.saved.videos[keywords].prettyPrint()} is already saved as *${keywords}*! Overwriting.`);

  var key;
  if (key = Saved.isVideoSaved(vid)) client.reply(m, `Warning: This video is already saved as *${key}*! Adding it anyway as *${keywords}*.`);

  Saved.saved.videos[keywords] = simplified;
  client.reply(m, `Saved video ${video.prettyPrint()} as *${keywords}*`);
  Saved.write();
}

function possiblyQueue(video, userId, m, suppress) {
  video.userId = userId;
  suppress = (suppress === undefined) ? false : suppress;
  reason = shouldDisallowQueue(playQueue, video, Config);
  if (!userIsAdmin(userId) && reason) {
    fancyReply(m, `You can't queue **${video.title}** right now! Reason: ${reason}`);
  } else {
    playQueue.push(video);
    if (suppress == 0) fancyReply(m, `Queued ${video.prettyPrint()}`);
    else if (suppress > -1) fancyReply(m, `Queued ${video.prettyPrint()} and ${suppress} other videos`);

    // Start playing if not playing yet
    if (!currentVideo) nextInQueue();
  }
}

function handleYTError(err) {
  if (err.toString().indexOf('Code 150') > -1) {
    // Video unavailable in country
    boundChannel.sendMessage('This video is unavailable in the country the bot is running in! Please try a different video.');
  } else if (err.message == 'Could not extract signature deciphering actions') {
    boundChannel.sendMessage('YouTube streams have changed their formats, please update `ytdl-core` to account for the change!');
  } else if (err.message == 'status code 404') {
    boundChannel.sendMessage('That video does not exist!');
  } else {
    boundChannel.sendMessage('An error occurred while getting video information! Please try a different video.');
  }

  console.log(err.toString());
}

function playStopped() {
  if (client.internal.voiceConnection) client.internal.voiceConnection.stopPlaying();

  boundChannel.sendMessage(`Finished playing **${currentVideo.title}**`);
  client.setStatus('online', null);
  lastVideo = currentVideo;
  currentVideo = false;
  nextInQueue();
}

function play(video) {
  currentVideo = video;
  if (client.internal.voiceConnection) {
    var connection = client.internal.voiceConnection;
    currentStream = video.getStream();

    currentStream.on('error', (err) => {
      if (err.code === 'ECONNRESET') {
        if (!Config.suppressPlaybackNetworkError) {
          boundChannel.sendMessage(`There was a network error during playback! The connection to YouTube may be unstable. Auto-skipping to the next video...`);
        }
      } else {
        boundChannel.sendMessage(`There was an error during playback! **${err}**`);
      }

      playStopped(); // skip to next video
    });

    //currentStream.on('end', () => setTimeout(playStopped, Config.timeOffset || 8000)); // 8 second leeway for bad timing, this caused bad timing
    connection.playRawStream(currentStream).then(intent => {
      boundChannel.sendMessage(`Playing ${video.prettyPrint()}`);
      client.setStatus('online', video.title);
      intent.on('end', ()=>{
        playStopped();
      });
    });
  }
}

function userIsAdmin(userId) {
  return Config.adminIds.indexOf(userId) > -1;
}

function checkCommand(m, command) {
  if (Config.commandsRestrictedToAdmins[command]) {
    if (!userIsAdmin(m.author.id)) {
      client.reply(m, `You don't have permission to execute that command! (user ID: \`${m.author.id}\`)`);
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

function fancyReply(m, message) {
  if (shouldStockpile) {
    stockpile += message + '\n';
  } else {
    client.reply(m, message);
  }
}

function spitUp(m) {
  client.reply(m, stockpile);
  stockpile = '';
  shouldStockpile = false;
}

function error(argument) {
  console.log(argument.stack);
}

// Email and password over command line
client.login(process.argv[2] || Config.auth.email, process.argv[3] || Config.auth.password).catch((e) => {
  try {
    if (e.status === 400 && ~e.response.error.text.indexOf('email')) {
      console.log('Error: You entered a bad email!');
    } else if (e.status === 400 && ~e.response.error.text.indexOf('password')) {
      console.log('Error: You entered a bad password!');
    } else {
      console.log(e);
    }
  } catch (err) {
    console.log(e);
  }
});

process.on('uncaughtException', function(err) {
  // Handle ECONNRESETs caused by `next` or `destroy`
  if (err.code == 'ECONNRESET') {
    // Yes, I'm aware this is really bad node code. However, the uncaught exception
    // that causes this error is buried deep inside either discord.js, ytdl or node
    // itself and after countless hours of trying to debug this issue I have simply
    // given up. The fact that this error only happens *sometimes* while attempting
    // to skip to the next video (at other times, I used to get an EPIPE, which was
    // clearly an error in discord.js and was now fixed) tells me that this problem
    // can actually be safely prevented using uncaughtException. Should this bother
    // you, you can always try to debug the error yourself and make a PR.
    console.log('Got an ECONNRESET! This is *probably* not an error. Stacktrace:');
    console.log(err.stack);
  } else {
    // Normal error handling
    console.log(err);
    console.log(err.stack);
    process.exit(0);
  }
});
