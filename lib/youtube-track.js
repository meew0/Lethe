var ytdl = require('ytdl-core');

module.exports = YoutubeTrack = function(vid, m, cb) {
  var _this = this;
  var requestUrl = 'http://www.youtube.com/watch?v=' + vid;
  ytdl.getInfo(requestUrl, (err, info) => {
    if (err) cb(err, undefined);
    else {
      _this.vid = vid;
      _this.title = info.title;
      _this.author = info.author;
      _this.viewCount = info.viewCount;
      _this.lengthSeconds = info.lengthSeconds;
      _this.userId = m.author.id;
      _this.containedVideo = info;
      cb(_this);
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

YoutubeTrack.prototype.formatViewCount = () => this.viewCount ? this.viewCount.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'unknown';
YoutubeTrack.prototype.formatTime = () => `${Math.round((_this.lengthSeconds - Math.ceil(_this.lengthSeconds % 60)) / 60)}:${String('00' + Math.ceil(_this.lengthSeconds % 60)).slice(-2)}`;
YoutubeTrack.prototype.prettyPrint = () => `**${this.title}** by **${this.author}** *(${this.formatViewCount()} views)* [${this.formatTime()}]`;
YoutubeTrack.prototype.fullPrint = () => `${this.prettyPrint()}, added by <@${this.userId}>`;
YoutubeTrack.prototype.saveable = function() {
  return {
    vid: this.vid,
    title: this.title,
    author: video.author,
    viewCount: video.viewCount,
    lengthSeconds: video.lengthSeconds,
  };
};
