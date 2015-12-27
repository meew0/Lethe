var ytdl = require('ytdl-core');
var Track = require('./track.js');

module.exports = YoutubeTrack = function() {
  Track.apply(this, arguments);
};

YoutubeTrack.prototype = Object.create(Track.prototype);

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
