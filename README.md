# Lethe
Simple YouTube playback bot for Discord

## Usage
Run Lethe using the email and password as command line arguments:

```
$ node lethe.js email@example.com hunter2
```

Then, run commands over Discord using the bot's username mention as a prefix, for example:

```
@Bot init
```

Where "Bot" is your bot's username.

## Commands

`init`: Initializes Lethe and binds it to the channel this command was run in and the first voice channel it can find (usually General).  
`destroy`: Destroys Lethe's binding. This stops the current playback and unbinds it from the text and voice channel.

The following commands will only work inside the text channel Lethe was bound to.

`yt [id]`: Queues a video from YouTube to be played. If this is the only song in the queue, start playback. `queue [id]` does the same thing.  
`list`: Lists the videos on the queue.  
`next`: Stops the current playback and skips to the next video in the queue.
