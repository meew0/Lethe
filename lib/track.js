var Util = require('./util.js');

module.exports = Track = function(vid, info) {
  this.vid = vid;
  this.title = info.title;
  this.author = info.author;
  this.viewCount = info.viewCount || info.view_count;
  this.lengthSeconds = info.lengthSeconds || info.length_seconds;
};

Track.prototype.formatViewCount = function() {
  return this.viewCount ? this.viewCount.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'unknown';
};

Track.prototype.formatTime = function() {
  return Util.formatTime(this.lengthSeconds);
};

Track.prototype.prettyPrint = function() {
  return `**${this.title}** by **${this.author}** *(${this.formatViewCount()} views)* [${this.formatTime()}]`;
};

Track.prototype.fullPrint = function() {
  return `${this.prettyPrint()}, added by <@${this.userId}>`;
};

Track.prototype.saveable = function() {
  return {
    vid: this.vid,
    title: this.title,
    author: this.author,
    viewCount: this.viewCount,
    lengthSeconds: this.lengthSeconds,
  };
};
