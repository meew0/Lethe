var exports = {};

exports.simplePrint = function(video) {
  return `**${video.title}**`;
};

exports.prettyPrint = function(video) {
  try{
    viewCount = video.view_count.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  catch(e){
    viewCount = 'unknown';
  }
  return `**${video.title}** by **${video.author}** *(${viewCount} views)*`;
};

exports.prettyPrintWithUser = function(video) {
  return exports.prettyPrint(video) + `, added by <@${video.userId}>`;
};

exports.simplify = function(video, vid) {
  return {
    vid: vid,
    title: video.title,
    author: video.author,
    view_count: video.view_count,
  };
};

exports.prettyTime = function(ms) {
  var seconds = ms / 1000;
  var actualSeconds = Math.ceil(seconds % 60);
  var paddedSeconds = String('00' + actualSeconds).slice(-2);
  var minutes = Math.round((seconds - actualSeconds) / 60);
  if(String(minutes).length==1)
    minutes = `0${minutes}`;
  return `${minutes}:${paddedSeconds}`;
};

module.exports = exports;
