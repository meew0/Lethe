# Lethe
Simple YouTube playback bot for Discord. Lethe is WIP, so expect crashes (it has significantly improved from the past though!) Please report any crashes as a GitHub [issue](https://github.com/meew0/Lethe/issues).

Lethe works best on Linux, but it can also be installed on Windows, though this is not recommended.

## Installation

**You might also want to take a look at the [Beginner's Guide](https://github.com/meew0/Lethe/wiki/Beginner's-Guide-to-Lethe-Installation) if all this intimidates you.

If you're on Windows, you should install node-opus before everything else, as there may be problems with the installation:
```
npm install node-opus
```
If there are any, follow the instructions on how to fix them. See issue #9 for more information.

Then, install [ffmpeg](https://www.ffmpeg.org/download.html). Depending on your system, it may already be preinstalled (run `ffmpeg` in a terminal, if it works, then it's installed). On Windows, after installing it, make sure it's in your PATH environment variable, otherwise it won't be found by Lethe.

Finally, install Lethe itself:
```
git clone https://github.com/meew0/Lethe.git
cd Lethe
npm install
```

## Usage
Run Lethe using the email and password as command line arguments:

```
node lethe.js email@example.com hunter2 YouTube-api-key(optional)
```

Then, run commands over Discord using the bot's username mention as a prefix, for example:

```
@Bot init
```

Where "Bot" is your bot's username.

## Troubleshooting

* If an error along the lines of `Error: spawn help ENOENT` is written to the console when playing a video, then you don't have ffmpeg installed properly. Download it [here](https://www.ffmpeg.org/download.html) and make sure it's in your `PATH` so Lethe can find it.
* If videos queue without errors, show the "playing video" message, but no audio is in the chat, then node-opus is most likely not installed correctly. This is often a problem on Windows. Make sure node-gyp has all required build dependencies installed and manually check the node-opus installation for errors.
* If every video you try to queue fails with a "An error occurred while getting video information!" message and it says `Error: Could not extract signature deciphering actions` in the console, then ytdl-core is outdated. `npm update` should fix it.

## Commands

`init [voice channel name]`: Initializes Lethe and binds it to the text channel this command was run in and the specified voice channel. If no voice channel was specified, the first available one will be used (usually General).  
`destroy`: Destroys Lethe's binding. This stops the current playback and unbinds it from the text and voice channel.

The following commands will only work inside the text channel Lethe was bound to.

`yt [id]`: Queues a video from YouTube to be played. If this is the only song in the queue, start playback. `queue [id]` does the same thing, as does `play [id]`. `id` can be replaced with a keyword used to save a video using `save`.  
`list`: Lists the videos on the queue.  
`link`: Gets the link to view the video currently playing.  
`next`: Stops the current playback and skips to the next video in the queue.  
`replay`: Adds the current video again to the back of the queue.  
`save [id] [keyword]` Saves a video under a keyword. It can later be played back using `yt`.  
`time`: Gets the time the video is currently at.  
`yq [search-value]`: Searches a youtube video that matches the search value.  
`pl [playlist-id]`: Queues the 50 first videos of a playlist.  
`shuffle`: Shuffles the videos in the queue.
