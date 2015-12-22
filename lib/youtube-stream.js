var ytdl = require('ytdl-core');

var exports = {};

exports.getStream = function(videoToPlay) {
  var options = {
    filter: (format) => format.container === 'mp4',
    quality: 'lowest',
  };

  if (videoToPlay.obtainedFromGetInfo) {
    return video = ytdl.downloadFromInfo(videoToPlay, options);
  } else {
    return video = ytdl(videoToPlay.loaderUrl, options);
  }
};

module.exports = exports;
