var fs = require('fs');

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
        exports.saved = JSON.parse(data);
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

module.exports = exports;
