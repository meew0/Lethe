var request = require('superagent');
var exports = {};

// Format an amount of time given in seconds to MM:SS format.
exports.formatTime = function(seconds) {
  return `${Math.round((seconds - Math.ceil(seconds % 60)) / 60)}:${String('00' + Math.ceil(seconds % 60)).slice(-2)}`;
};

// Write some data to hastebin
exports.haste = function(data, cb) {
  request.post('http://hastebin.com/documents').send(data).end((error, result) => {
    if (error) {
      console.log('Error during haste: ' + error.stack);
      cb(false);
    } else {
      cb(result.body.key);
    }
  });
};

// Shuffle an array
exports.shuffle = function(array) {
  var counter = array.length;
  var temp;
  var index;

  // While there are elements in the array
  while (counter > 0) {
    index = Math.floor(Math.random() * counter);

    counter--;

    temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
};

module.exports = exports;
