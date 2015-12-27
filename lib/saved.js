var fs = require('fs');
var YoutubeTrack = require('./youtube-track.js');

var exports = {
  saved: {
    videos: {},
  },
};

var FILENAME = 'lethe-data.json';

exports.read = function() {
  try {
    fs.readFile(FILENAME, 'utf8', (err, data) => {
      if (err) {
        if (err.message.indexOf('ENOENT') > -1) {
          // File doesn't exist
          console.log(`The lethe-data.json file doesn't exist! This is not an error.`);
        } else {
          console.log(err);
        }
      } else {
        var savedVideos = JSON.parse(data).videos;
        exports.saved.videos = {};
        for (var key in savedVideos) {
          if (savedVideos.hasOwnProperty(key)) {
            exports.saved.videos[key] = new YoutubeTrack(savedVideos[key].vid, savedVideos[key]);
          }
        }
      }
    });
  } catch (e) {
    console.log(e);
  }
};

exports.write = function() {
  fs.writeFile(FILENAME, JSON.stringify(exports.saved), (err) => {
    if (err) {
      console.log(err);
    }
  });
};

exports.possiblyRetrieveVideo = function(argument) {
  if (exports.saved.videos.hasOwnProperty(argument)) return exports.saved.videos[argument].vid;
  else return argument;
};

exports.isVideoSaved = function(vid) {
  for (var key in exports.saved.videos) {
    if (exports.saved.videos.hasOwnProperty(key)) {
      var dupe = exports.saved.videos[key];
      if (dupe.vid === vid) {
        return key;
      }
    }
  }

  return false;
};

module.exports = exports;
