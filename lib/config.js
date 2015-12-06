var fs = require('fs');

var exports = {};

var FILENAME = 'lethe-config.json';

var reload = function() {
  try {
    fs.readFile(FILENAME, 'utf8', (err, data) => {
      if (err) {
        if (err.message.indexOf('ENOENT') > -1) {
          // File doesn't exist
          console.log(`The lethe-config.json file doesn't exist!`);
        } else {
          console.log(err);
        }
      } else {
        exports = JSON.parse(data);
        exports.reload = reload;
      }
    });
  } catch (e) {
    console.log(e);
  }
};

reload();

module.exports = exports;
