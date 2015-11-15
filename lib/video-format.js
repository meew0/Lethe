var exports = {};

exports.simplePrint = function(video) {
  return `**${video.title}**`;
};

exports.prettyPrint = function(video) {
  viewCount = video.view_count.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `**${video.title}** by **${video.author}** *(${viewCount} views)*`;
};

exports.prettyPrintWithUser = function(video) {
  return exports.prettyPrint(video) + `, added by <@${video.userId}>`;
};

exports.simplify = function(video) {
  return {
    vid: video.vid,
    title: video.title,
    author: video.author,
    view_count: video.view_count,
  };
};

exports.prettyTime = function(ms) {
  var seconds = ms / 1000;
  var actualSeconds = Math.ceil(seconds % 60);
  var minutes = (seconds - actualSeconds) / 60;
  return `${minutes}:${actualSeconds}`;
};

module.exports = exports;
