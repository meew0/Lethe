function checkDuplicateUser(playQueue, video, config) {
  if (config.userQueueLimit <= -1) return false;

  var count = 0;
  for (element of playQueue) {
    if (element.userId === video.userId) count++;
  }

  return (count >= config.userQueueLimit);
}

function checkDuplicateVideo(playQueue, video, config) {
  for (element of playQueue) {
    if (element.vid === video.vid) return true;
  }

  return false;
}

function checkVideoLength(playQueue, video, config) {
  if (config.maxLength > -1) {
    if (video.lengthSeconds > config.maxLength) {
      return true;
    }
  }

  return false;
}

var checks = [
  [checkDuplicateVideo, 'That video is already in the queue!'],
  [checkDuplicateUser, 'You already have too many videos in the queue!'],
  [checkVideoLength, 'That video is too long!'],
];

function shouldDisallowQueue(playQueue, video, config) {
  for (check of checks) {
    if (config.checksEnabled[check[0].name]) {
      result = check[0](playQueue, video, config);
      if (result) return check[1];
    }
  }

  return false;
}

module.exports = shouldDisallowQueue;
