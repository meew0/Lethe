var fs = require('fs');

var exports = {
  saved: {
    videos: {},
  },
};

var FILENAME = 'lethe-data.json';

exports.read = function() {
  fs.readFile(FILENAME, 'utf8', (err, data) => {
    if (err) {
      // Probably the file just doesn't exist, so don't do anything else
      console.log(err);
    } else {
      exports.saved = JSON.parse(data);
    }
  });
};

exports.write = function() {
  fs.writeFile(FILENAME, JSON.stringify(exports.saved), (err) => {
    if (err) {
      console.log(err);
    }
  });
};

exports.possiblyRetrieveVideo = function(argument) {
  if (exports.saved.videos.hasOwnProperty(argument)) return Saved.saved.videos[argument];
  else return argument;
};

module.exports = exports;
