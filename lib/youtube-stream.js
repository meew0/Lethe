var ytdl = require('ytdl-core');

var exports = {};

exports.getStream = function(url) {
  var options = {
    filter: (format) => format.container === 'mp4',
    quality: 'lowest',
  };

  return video = ytdl(url, options);
};

module.exports = exports;
