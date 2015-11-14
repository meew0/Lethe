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

module.exports = exports;
