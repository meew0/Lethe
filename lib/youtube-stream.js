var ytdl = require('ytdl-core');

var exports = {};

exports.getStream = function(url) {
  var options = {
    filter: (format) => format.container === 'mp4',
    quality: 'lowest',
  };

  if (video.obtainedFromGetInfo) {
    return video = ytdl.downloadFromInfo(video, options);
  } else {
    return video = ytdl(video.loaderUrl, options);
  }
};

module.exports = exports;
