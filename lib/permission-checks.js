function checkDuplicateUser(playQueue, video, config) {
  var count = 0;
  playQueue.forEach((element) => {
    if (element.userId === video.userId) count++;
  });
  return (count >= 2);
}

function checkDuplicateVideo(playQueue, video, config) {
  playQueue.forEach((element) => {
    if (element.vid === video.vid) return true;
  });
  return false;
}

function checkVideoLength(playQueue, video, config) {
  if (config.maxLength > -1) {
    if (video.length_seconds > config.maxLength) {
      return true;
    }
  }

  return false;
}

var checks = [
  [checkDuplicateVideo, 'That video is already in the queue'],
  [checkDuplicateUser, 'You already have two videos in the queue'],
  [checkVideoLength, 'That video is too long!'],
];

function shouldDisallowQueue(playQueue, video, config) {
  for (check of checks) {
    result = check[0](playQueue, video, config);
    if (result) return check[1];
  }

  return false;
}

module.exports = shouldDisallowQueue;
