function checkDuplicateUser(playQueue, video) {
  var count = 0;
  playQueue.forEach((element) => {
    if (element.userId === video.userId) count++;
  });
  return (count >= 2);
}

function checkDuplicateVideo(playQueue, video) {
  playQueue.forEach((element) => {
    if (element.vid === video.vid) return true;
  });
  return false;
}

var checks = [
  [checkDuplicateVideo, 'That video is already in the queue'],
  [checkDuplicateUser, 'You already have two videos in the queue'],
];

function shouldDisallowQueue(playQueue, video) {
  checks.forEach((checks) => {
    result = checks[0](playQueue, video);
    if (result) return result.reason;
  });
  return false;
}

module.exports = shouldDisallowQueue;
