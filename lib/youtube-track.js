var ytdl = require('ytdl-core');

module.exports = YoutubeTrack = function(vid, cb) {
  var _this = this;
  var requestUrl = 'http://www.youtube.com/watch?v=' + vid;
  ytdl.getInfo(requestUrl, (err, info) => {
    if (err) cb(err, undefined);
    else {
      _this.vid = info.vid;
      _this.title = info.title;
      _this.author = info.author;
      _this.viewCount = info.viewCount;
      _this.lengthSeconds = info.lengthSeconds;
      _this.containedVideo = info;
      cb(_this);
    }
  });
};

YoutubeTrack.getStream = function() {
  var options = {
    filter: (format) => format.container === 'mp4',
    quality: 'lowest',
  };

  return ytdl.downloadFromInfo(this.containedVideo, options);
};
