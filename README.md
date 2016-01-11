![Warning Banner for Debug](http://i.imgur.com/AG2nc64.png)
![Lethe Banner](http://i.imgur.com/VHaggpM.png)
A simple YouTube playback bot for Discord using discord.js. Lethe is a WIP, that means crashes can occur. Please report any crashes not already reported as a GitHub [issue](https://github.com/meew0/Lethe/issues).

Lethe works best on Linux, but can be installed on Windows.

## Installation

**If this doesn't make any sense, you might want to take a look at the [Beginner's Guide](https://github.com/meew0/Lethe/wiki/Beginner's-Guide-to-Lethe-Installation) before attempting to install.**

If you're using Windows, install node-opus first, as there may be problems with the installation:
```
npm install node-opus
```
If there are any problems installing node-opus, follow the instructions on issue #9.

Now install [ffmpeg](https://www.ffmpeg.org/download.html). Depending on your system, it may already be preinstalled (run `ffmpeg` in a terminal, if it works, then it's installed). On Windows, after installing it, make sure it's in your PATH environment variable, otherwise it won't be found by Lethe.

Finally, install Lethe itself:
```
git clone https://github.com/meew0/Lethe.git
cd Lethe
npm install
```

## Usage
####Run by Command Line Arguments
Run Lethe using the email and password as command line arguments:

```
node lethe.js email@example.com hunter2 YouTube-api-key(optional)
```

####Run by pre-set credentials in lethe-auth.json
Change the values inside lethe-auth.json to make it easier to run Lethe.
```
{
  "email": "discord email",
  "password": "discord password",
  "apiKey": "youtube API key (optional)"
}
```
Then just use ```node lethe.js``` to run Lethe.


Now you can run commands over Discord using the bot's username mention as a prefix, for example:

```
@Bot init
```
Where "Bot" is your bot's username.

###First Run
On your first run, you must set the permissions for Lethe. To do this, you must be able to manage your Discord server OR modify the lethe-config.json file manaully to add your user id.

If you have permission to manage the Discord server your bot will be attached to, use the following command:
```
@Bot runonce
```
Where "Bot" is your bot's username.

## Troubleshooting

* If an error along the lines of `Error: spawn help ENOENT` is written to the console when playing a video, then you don't have ffmpeg installed properly. Download it [here](https://www.ffmpeg.org/download.html) and make sure it's in your `PATH` so Lethe can find it.
* If videos queue without errors, show the "playing video" message, but no audio is in the chat, then node-opus is most likely not installed correctly. This is often a problem on Windows. Make sure node-gyp has all required build dependencies installed and manually check the node-opus installation for errors.
* If every video you try to queue fails with a "An error occurred while getting video information!" message and it says `Error: Could not extract signature deciphering actions` in the console, then ytdl-core is outdated. `npm update` should fix it.

## Commands

`init [voice channel name]`: Initializes Lethe and binds it to the text channel this command was run in and the specified voice channel. If no voice channel was specified, Lethe connects to whatever channel you are connected to or the first available channel (Most Likely General).  
`destroy`: Destroys Lethe's binding. This stops the current playback and unbinds it from the text and voice channel.

The following commands will only work inside the text channel Lethe was bound to.

`yt [id]`: Queues a video from YouTube to be played. If this is the only song in the queue, start playback. `queue [id]` does the same thing, as does `play [id]`. `id` can be replaced with a keyword used to save a video using `save`.  
  
`list`: Lists the videos on the queue.  
`list all` : Private Messages all current songs to you.  
`list saved` : Lists all saved songs. **May cause a crash**  
`link`: Gets the link to view the video currently playing.  
`next`: Stops the current playback and skips to the next video in the queue.  
`replay`: Adds the current video again to the back of the queue.  
`save [id] [keyword]` Saves a video under a keyword. It can later be played back using `yt`.  
`time`: Gets the time the video is currently at.  
`yq [search-value]`: Searches a youtube video that matches the search value.  
`pl [playlist-id]`: Queues the 50 first videos of a playlist.  
`shuffle`: Shuffles the videos in the queue.  
`help` : Returns the list above in a private message.
