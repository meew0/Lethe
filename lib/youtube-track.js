var ytdl = require('ytdl-core');
var Util = require('./util.js');

module.exports = YoutubeTrack = function(vid, info) {
  this.vid = vid;
  this.title = info.title;
  this.author = info.author;
  this.viewCount = info.viewCount || info.view_count;
  this.lengthSeconds = info.lengthSeconds || info.length_seconds;
};

YoutubeTrack.getInfoFromVid = function(vid, m, cb) {
  var requestUrl = 'http://www.youtube.com/watch?v=' + vid;
  ytdl.getInfo(requestUrl, (err, info) => {
    if (err) cb(err, undefined);
    else {
      var video = new YoutubeTrack(vid, info);
      video.userId = m.author.id;
      video.containedVideo = info;
      cb(undefined, video);
    }
  });
};

YoutubeTrack.prototype.getStream = function() {
  var options = {
    filter: (format) => format.container === 'mp4',
    quality: 'lowest',
  };

  return ytdl.downloadFromInfo(this.containedVideo, options);
};

YoutubeTrack.prototype.formatViewCount = function() {
  return this.viewCount ? this.viewCount.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'unknown';
};

YoutubeTrack.prototype.formatTime = function() {
  return Util.formatTime(this.lengthSeconds);
};

YoutubeTrack.prototype.prettyPrint = function() {
  return `**${this.title}** by **${this.author}** *(${this.formatViewCount()} views)* [${this.formatTime()}]`;
};

YoutubeTrack.prototype.fullPrint = function() {
  return `${this.prettyPrint()}, added by <@${this.userId}>`;
};

YoutubeTrack.prototype.saveable = function() {
  return {
    vid: this.vid,
    title: this.title,
    author: this.author,
    viewCount: this.viewCount,
    lengthSeconds: this.lengthSeconds,
  };
};
