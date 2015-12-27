var exports = {};

// Format an amount of time given in seconds to MM:SS format.
exports.formatTime = function(seconds) {
  return `${Math.round((seconds - Math.ceil(seconds % 60)) / 60)}:${String('00' + Math.ceil(seconds % 60)).slice(-2)}`;
};

module.exports = exports;
