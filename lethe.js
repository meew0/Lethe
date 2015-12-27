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
var VideoFormat = require('./lib/video-format.js');
var YoutubeStream = require('./lib/youtube-stream.js');
var Saved = require('./lib/saved.js');
Saved.read();

var Config = require('./lib/config.js');
var CURRENT_REV = 2;

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
if (process.argv[4]) {
  var apiKey = process.argv[4];
} else {
  var apiKey = false;
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

  if (m.content.startsWith(`?info`)) {
    if (!checkCommand(m, '?info')) return;
    git.short(commit => git.branch(branch => {
      client.reply(m, `Version: \`Lethe#${branch}@${commit}\` (cf: ${Config.configRev} cr: ${CURRENT_REV}). Info about Lethe can be found at https://github.com/meew0/Lethe.`);
    }));
    return;
  }
 if (m.content.startsWith(`?userID`)) { // userID
    if (!checkCommand(m, `?userID`)) return;
    client.reply(m, m.author.id);
    return;
 }
 if (m.content.startsWith(`?ben`)) { // a meme
    if (!checkCommand(m, `?ben`)) return
    var benArray = ["**BEN'S STATUS** \n Lips: LARGE \n Feelings: WHO CARES \n Race: SHADOW-REALM BEAST", "http://puu.sh/m3gGP/de199907f3.png", "http://puu.sh/m3gDD/3c6f7c553b.png", "http://puu.sh/m3gIA/28638cd9ad.jpg", "http://puu.sh/m9tgv/84bc2f4914.jpg", "http://puu.sh/m9tfd/fdd3ad0c46.jpg", "http://puu.sh/m9th3/12a1326552.jpg", "https://cdn.discordapp.com/attachments/93578176231374848/130413901367083008/benkms.jpg" ,"https://cdn.discordapp.com/attachments/93578176231374848/130413948091629568/ben.jpg", "https://puu.sh/ldqI3/7fe79e185e.jpg", "https://puu.sh/ldqI3/7fe79e185e.jpg", "https://puu.sh/ldqC3/563b0df440.jpg", "http://puu.sh/lvryP/a7aeb5c7f2.jpg", "http://puu.sh/l0dy0/97c6792172.jpg"]
    client.reply(m, benArray[Math.floor(Math.random() * benArray.length)])
    return;
 }
 if (m.content.startsWith(`?chancey`)) { // chancey telling off darrell
    if (!checkCommand(m, `?chancey`)) return
    var chanceyArray = ["\n >attacking \n I was telling you how is it when you legit tell me to \"promise\" you to text first. \n I was implying that I cannot guarantee shit like this because it rarely happens, even if someone were to complain. \n Attack sounds like this: \n You sound like you're triggered. Where's your problem glasses? Oh wait. You're a nigger! You're just gonna complain that everything bad that happens to you is because you're black. Are you ready to get cucked by your master? Or perhaps you'd rather fuck gorillas aka your own people.", "http://puu.sh/lvpn6/2199db5dcd.png"]
    client.reply(m, chanceyArray[Math.floor(Math.random()*chanceyArray.length)])
    return;
 }
 if (m.content.startsWith(`?nanami`)) { //nanami
  if (!checkCommand(m, `?vanilla`)) return
  var vanillaArray = ["https://i.gyazo.com/fb6577a3239a86a24fac222e53b1e889.png"]
  client.reply(m, vanillaArray[0])
}
 if (m.content.startsWith(`?uni`)) { //uni
    if (!checkCommand(m, `?uni`)) return
    var uniArray = ["https://puu.sh/lTwMZ/0176bb7075.JPG", "http://puu.sh/lNwLG/47cc9cf362.png", "http://puu.sh/m9whg/187a691bc7.png"]
    client.reply(m, uniArray[Math.floor(Math.random() * uniArray.length)])
    return;
 }
if (m.content.startsWith(`?homieroast`)) { //when ya homie gets roasted
  if (!checkCommand(m, `?homieroast`)) return
  client.reply(m, "https://40.media.tumblr.com/a45905c3728d9e12c0cf75f1068dc1ca/tumblr_noto8ys9Uc1rraq2ko2_1280.jpg")
  return;
}
if (m.content.startsWith(`?jimbo`)) { //shadow realm jimbo
  if (!checkCommand(m, `?jimbo`)) return
  client.reply(m, "http://puu.sh/m1Ta5/910f1b8e35.png")
  return;
}
if (m.content.startsWith(`?stayfree`)) { //FREE
  if (!checkCommand(m, `?stayfree`)) return
  client.reply(m, "http://ecx.images-amazon.com/images/I/81GRxyntAaL._SL1500_.jpg")
  return;
}
if (m.content.startsWith(`?dion`)) { //fuckin spooked
  if (!checkCommand(m, `?dion`)) return
  var dionArray = ["http://puu.sh/m9kCz/81350ea87f.jpg", "http://puu.sh/m9oFW/fda62eb112.png", "https://i.gyazo.com/8606fb25fb564bd0235f482edb9dc921.png", "https://cdn.discordapp.com/attachments/128148462683422720/130425654255681536/IMG_1515.PNG", "http://puu.sh/lzAgv/55c4276d7c.png"]
  client.reply(m, dionArray[Math.floor(Math.random() * dionArray.length)])
  return;
}
if (m.content.startsWith(`?fang`)) { // what a fuckin retard
  if (!checkCommand(m, `?fang`)) return
  var fangArray = ["http://puu.sh/m2Xfd/bdfa504036.png", "http://puu.sh/m2Wew/d1fd328349.png", "http://puu.sh/m2VSU/b481f10fe6.png","http://puu.sh/m2VQa/85113beedc.png"]
  client.reply(m, fangArray[Math.floor(Math.random() * fangArray.length)])
  return;
}
if (m.content.startsWith(`?starterpack`)) { //memecontrol
  if (!checkCommand(m, `?pack`)) return
  var starterpackArray = ["https://puu.sh/l4EIB/6e34ebbe36.jpg", "https://puu.sh/l4EAy/ecd052884e.jpg", "https://puu.sh/l4EtZ/a4f6819dfe.jpg", "https://puu.sh/l4Em3/e065f1a648.jpg", "https://puu.sh/l4EiX/4058337b49.jpg", "https://puu.sh/l4E38/787f1d7295.jpg", "https://puu.sh/l4E1q/a5c291f274.jpg", "http://cdn2.gurl.com/wp-content/uploads/2014/11/real-music-starter-pack.jpg", "http://socawlege.com/wp-content/uploads/2015/05/14.png", "http://socawlege.com/wp-content/uploads/2015/05/7.png", "http://cdn3.gurl.com/wp-content/uploads/2014/11/tumblr-white-girl-starter-pack.jpg", "https://puu.sh/m9PKe/fe80e20b66.png", "http://puu.sh/m9POD/7627d3cc78.png", "https://i.imgur.com/r3kOR9J.png", "http://puu.sh/m9PQ0/1a26c2f439.png", "http://orig10.deviantart.net/ae07/f/2015/169/0/c/the_i_hate_capitalism_starter_pack_by_billwilsoncia-d8xuw2b.png", "http://puu.sh/m9PR1/eeac97339a.png", "http://puu.sh/m9PRF/9946c618e1.png", "http://puu.sh/m9PSl/0dbfa24b47.png", "http://cdn.hiphopwired.com/wp-content/uploads/2014/11/starter-pack-2.png", "http://puu.sh/m9PTb/b73f4677d5.png", "http://puu.sh/m9PTX/2762d24475.png", "http://socawlege.com/wp-content/uploads/2014/12/kush.jpg", "https://i.imgur.com/lCWov56.jpg", "https://i.imgur.com/BfUDdnl.png", "http://cdn.hiphopwired.com/wp-content/uploads/2014/11/starter-pack-1.png", "http://www.starter-packs.com/wp-content/uploads/2014/12/home-alone.jpg", "http://cdn3.gurl.com/wp-content/uploads/2014/11/college-student-starter-pack.jpg", "https://i.imgur.com/M0oP8m4.jpg", "http://puu.sh/m9PZd/a0b5745764.png", "https://i.imgur.com/pDehVAX.jpg", "http://puu.sh/m9PZP/dc11be8fd2.png"];
  client.reply(m, starterpackArray[Math.floor(Math.random() * starterpackArray.length)])
  return;
} 
/* if (m.content.startsWith(``)) { //memecontrol
  if (!checkCommand(m, ``)) return
  client.reply(m, "")
  return
} 
*/
if (m.content.startsWith(`?mura`)) { //memecontrol
  if (!checkCommand(m, `?mura`)) return
  client.reply(m, "https://i.gyazo.com/21dd51c5175d5ea00d57a15aeb95beb2.png")
  return;
}
if (m.content.startsWith(`?gasthejaps`)) { //memecontrol
  if (!checkCommand(m, `?gasthejaps`)) return
  var gastheJaps = ["https://puu.sh/ksK2R/71306e0b2c.png", "https://puu.sh/ksJPk/378c22cdb3.png"]
  client.reply(m, gastheJaps[Math.floor(Math.random() * gastheJaps.length)])
  return;
}
if (m.content.startsWith(`?chill`)) { //memecontrol
  if (!checkCommand(m, `?chill`)) return
  client.reply(m, "https://puu.sh/kt0cd/76e8460d30.png")
  return
} 
if (m.content.startsWith(`?disgusting`)) { //FE disgusting
  if (!checkCommand(m, `?disgusting`)) return
  var disgustingArray = ["http://puu.sh/m9urN/727dc202f1.jpg", "http://puu.sh/m9uHU/55e21971c4.png", "http://puu.sh/m9usJ/42f703711b.jpg", "http://puu.sh/m9uKU/8e234f5886.png"]
  client.reply(m, disgustingArray[Math.floor(Math.random() * disgustingArray.length)])
  return
} 
if (m.content.startsWith(`?murder`)) { //FE murder
  if (!checkCommand(m, `?murder`)) return
  var murderArray = ["http://puu.sh/m9uEl/c078d7d7e3.jpg", "http://puu.sh/m9uDB/66606e1c4d.png", "http://puu.sh/m9uFf/5c50e06e88.png", "http://puu.sh/m9uCe/e950f095af.png"]
  client.reply(m, murderArray[Math.floor(Math.random() * murderArray.length)])
  return
} 
if (m.content.startsWith(`?clearlyaruse`)) { //embarassing...
  if (!checkCommand(m, `?clearlyaruse`)) return
  var ruseArray = ["http://puu.sh/m9upL/d08c7cae41.jpg", "http://puu.sh/m9uuY/c73bdb1d8c.jpg", "http://puu.sh/m9uJx/88d050f6fd.png"]
  client.reply(m, ruseArray[Math.floor(Math.random()*ruseArray.length)])
  return
} 
if (m.content.startsWith(`?stiff`)) { //stiffies and panties
  if (!checkCommand(m, `?stiff`)) return
  var stiffArray = ["http://puu.sh/m9vhb/e8eb27f5e8.png", "http://puu.sh/m9unQ/5e94a9615e.jpg"]
  client.reply(m, stiffArray[Math.floor(Math.random()*stiffArray.length)])
  return
} 
if (m.content.startsWith(`?sadness`)) { //memecontrol
  if (!checkCommand(m, `?sadness`)) return
  var sadArray = ["http://puu.sh/m9up0/97a92a25ae.png", "http://puu.sh/m9uua/882e72756e.png"]
  client.reply(m, [Math.floor(Math.random()*sadArray.length)])
  return
} 
if (m.content.startsWith(`?peace`)) { //PEACE
  if (!checkCommand(m, `?peace`)) return
  client.reply(m, "http://puu.sh/m9uG8/de8d3f9f9e.png")
  return
} 
if (m.content.startsWith(`?friends`)) { //PEACE
  if (!checkCommand(m, `?friends`)) return
  client.reply(m, "http://puu.sh/m9ux9/c2b3d3bfda.png")
  return
} 
if (m.content.startsWith(`?shock`)) { //PEACE
  if (!checkCommand(m, `?shock`)) return
  client.reply(m, "http://puu.sh/m9uBc/f5f18e509c.png")
  return
} 
if (m.content.startsWith(`?goodgirls`)){ //goodgrils
  if (!checkCommand(m, `?goodgirls`)) return
  client.reply(m, "http://puu.sh/m2X9z/d979127608.png")
  return
}
  if (m.content.startsWith(`?help`)) { // help
    if (!checkCommand(m, '?help')) return;
    client.reply(m, 'Commands - `?info, ?help, @(Botname) yt[youtube id], @(Botname) yq[search term], @(Botname) playlist, ?time, ?next, ?replay, ?list, ?link.(all video playing options require you to ping the bot)`');
    return;
  }

  if (m.content.startsWith(`?init`)) { // init
    if (!checkCommand(m, '?init')) return;
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

  if (m.content.startsWith(`${botMention} destroy`)) { // destroy
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

  if (m.content.startsWith(`?next`)) { // next
    if (!checkCommand(m, '?next')) return;
    playStopped();
  }

  if (m.content.startsWith(`${botMention} yq`) // youtube query
    || m.content.startsWith(`${botMention} qq`) // queue query
    || m.content.startsWith(`${botMention} pq`) // play query
    || m.content.startsWith(`${botMention} ytq`)) {

    if (!checkCommand(m, 'yq')) return;

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

        client.reply(m, 'Sorry, not even Ebola-chan could find videos matching your keywords. Try a different combination of search terms!');
      } else {
        client.reply(m, "....Something went wrong?");
        return;
      }
    });

    return; // have to stop propagation
  }

  if (m.content.startsWith(`?playlist`)) { // playlist
    if (!checkCommand(m, '?playlist')) return;

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

    request.get(requestUrl).end((error, response) => {
      if (!error && response.statusCode == 200) {
        console.log(response);
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
  }

  if (m.content.startsWith(`?replay`)) { // replay
    if (!checkCommand(m, '?replay')) return;
    var videoToPlay = currentVideo ? currentVideo : lastVideo ? lastVideo : false;
    if (!videoToPlay) {
      client.reply(m, 'No video has been played yet!');
      return;
    }

    playQueue.push(videoToPlay);
    client.reply(m, `Queued ${VideoFormat.prettyPrint(currentVideo)}`);
  }

  if (m.content.startsWith(`?shuffle`)) { // shuffle
    if (!checkCommand(m, '?shuffle')) return;
    if (playQueue.length < 2) {
      client.reply(m, 'Not enough songs in the queue.');
      return;
    } else {
      shuffle(playQueue);
      client.reply(m, 'Songs in the queue have been shuffled.');
    }

    return;
  }

  if (m.content.startsWith(`?link`)) {
    if (!checkCommand(m, '?link')) return;
    if (currentVideo) client.reply(m, `<${currentVideo.loaderUrl}>`);
    return; // stop propagation
  }

  if (m.content.startsWith(`?list s`)) { // list saved
    if (!checkCommand(m, '?list saved')) return;
    var formattedList = 'Here are the videos currently saved: \n';
    for (var key in Saved.saved.videos) {
      if (Saved.saved.videos.hasOwnProperty(key)) {
        formattedList += `*${key}*: ${VideoFormat.prettyPrint(Saved.saved.videos[key])}\n`;
      }
    }

    if (formattedList.length >= 2000) {
      haste(formattedList, (key) => {
        if (!key) {
          client.reply(m, 'There was an error while retrieving the list of saved videos! Sorry :(');
        }

        client.reply(m, `http://hastebin.com/${key}.md`);
      });
    } else client.reply(m, formattedList);
    return; // so list doesn't get triggered
  }

  if (m.content.startsWith(`?list`)) { // list
    if (!checkCommand(m, '?list')) return;

    var formattedList = '';
    if (currentVideo) formattedList += `Currently playing: ${VideoFormat.prettyPrintWithUser(currentVideo)}\n`;

    if (playQueue.length == 0) {
      formattedList += `The play queue is empty! Add something using **${botMention} yt *<video ID>***.`;
    } else {
      formattedList += 'Here are the videos currently in the play queue, from first added to last added: \n';

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
    }

    client.reply(m, formattedList);
  }

  if (m.content.startsWith(`?save`)) { // save
    if (!checkCommand(m, 'save')) return;
    var argument = spliceArguments(m.content)[1];
    if (!argument) {
      client.reply(m, 'You need to specify a video and a keyword!');
      return;
    }

    var splitArgs = spliceArguments(argument, 1);

    var vid = splitArgs[0];
    vid = resolveVid(vid, m);

    var requestUrl = 'http://www.youtube.com/watch?v=' + vid;
    ytdl.getInfo(requestUrl, (err, info) => {
      if (err) handleYTError(err);
      else saveVideo(info, vid, splitArgs[0], m);
    });
  }

  if (m.content.startsWith(`?time`)) { // time
    if (!checkCommand(m, '?time')) return;
    var streamTime = client.internal.voiceConnection.streamTime; // in ms
    var videoTime = currentVideo.length_seconds;
    client.reply(m, `${VideoFormat.prettyTime(streamTime)} / ${VideoFormat.prettyTime(videoTime * 1000)} (${(streamTime / (videoTime * 10)).toFixed(2)} %)`);
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
  requestUrl = 'http://www.youtube.com/watch?v=' + vid;
  ytdl.getInfo(requestUrl, (err, info) => {
    if (err) handleYTError(err);
    else {
      info.vid = vid;
      info.obtainedFromGetInfo = true;
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
    fancyReply(m, `You can't queue ${VideoFormat.simplePrint(video)} right now! Reason: ${reason}`);
  } else {
    playQueue.push(video);
    if (suppress == 0) fancyReply(m, `Queued ${VideoFormat.prettyPrint(video)}`);
    else if (suppress > -1) fancyReply(m, `Queued ${VideoFormat.prettyPrint(video)} and ${suppress} other videos`);

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

  boundChannel.sendMessage(`Finished playing ${VideoFormat.simplePrint(currentVideo)}`);
  client.setStatus('online', null);
  lastVideo = currentVideo;
  currentVideo = false;
  nextInQueue();
}

function play(video) {
  currentVideo = video;
  if (client.internal.voiceConnection) {
    var connection = client.internal.voiceConnection;
    currentStream = YoutubeStream.getStream(video);

    currentStream.on('error', (err) => {
      boundChannel.sendMessage(`There was an error during playback! **${err}**`);
    });

    currentStream.on('end', () => setTimeout(playStopped, Config.timeOffset || 8000)); // 8 second leeway for bad timing
    connection.playRawStream(currentStream).then(intent => {
      boundChannel.sendMessage(`Playing ${VideoFormat.prettyPrint(video)}`);
      client.setStatus('online', video.title);
    });
  }
}

function userIsAdmin(userId) {
  return Config.adminIds.indexOf(userId) > -1;
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

function fancyReply(m, message) {
  if (shouldStockpile) {
    stockpile += message + '\n';
  } else {
    client.reply(m, message);
  }
}

function haste(data, cb) {
  request.post('http://hastebin.com/documents').send(data).end((error, result) => {
    if (error) {
      cb(false);
    } else {
      cb(result.body.key);
    }
  });
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
client.login(process.argv[2], process.argv[3]).catch((e) => console.log(e));
