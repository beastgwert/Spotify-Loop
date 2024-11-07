const interval = 1000; // Poll every 1 second
let accessToken = ""; 
let queueIndex = -1;
let queue: string | any[] = [];

// Revive service worker so it doesnt expire every 30 sec
let refreshID = -1;
const keepAlive = () => {
    refreshID = setInterval(async () => {
        const curTrack = await getCurrentTrack();
        console.log("comparison: " + curTrack + ' ' + queue[queueIndex].uri);
        if(refreshID != -1 && curTrack != queue[queueIndex].uri){
            console.log("interval cleared");
            clearInterval(refreshID);
        }
        return chrome.runtime.getPlatformInfo;
    }, 20e3);
}
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

chrome.storage.local.get({accessToken: "", queueIndex: -1, queue: []}, (data) => {
    accessToken = data.accessToken;
    queueIndex = data.queueIndex;
    queue = data.queue;
})

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(`Storage key "${key}" in chrome.storage.local changed.`);
        console.log("Old value:", oldValue);
        console.log("New value:", newValue);
  
        // Perform actions based on specific key changes
        if (key === "accessToken") {
          accessToken = newValue;
        }
        else if(key == "queueIndex") {
            console.log("Queue index was changed to " + queueIndex)
            queueIndex = newValue;
            changePlaying();
        }
        else if(key == "queue"){
            queue = newValue;
        }
      }
    }
  });

const changePlaying = async () => {
    let playingParameters = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      },
      body: JSON.stringify({
        // 'context_uri': playing.artists[0].uri,
        'uris': [queue[queueIndex].uri]
      })
    }
    const response = await fetch('https://api.spotify.com/v1/me/player/play', playingParameters);
    console.log(response.status, response.statusText);
    console.log([queue[queueIndex].uri]);
  }
  
const checkTrackEnd = async () => {
  try {
    console.log("access token: " + accessToken);
    if(accessToken == "" || queueIndex == -1 || queue.length == 0) return;
    const response = await fetch('https://api.spotify.com/v1/me/player', {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });

    const data = await response.json();
    const progressMs = data.progress_ms;
    const durationMs = data.item.duration_ms;

    if(!data.is_playing) {
      console.log(progressMs + " " + durationMs);
      if(progressMs == 0){
        console.log('Track ended ' + queueIndex + " " + queue.length + " " + (queueIndex + 1) % queue.length);
        chrome.storage.local.set({queueIndex: (queueIndex + 1) % queue.length});
      }
      else console.log('Playback is paused or stopped:');
    }
    else {
        console.log('Track is still playing');
    }
  } catch (error) {
    console.error('Error checking track state:', error);
  }
};

const getCurrentTrack = async () => {
    try {
        if(accessToken == "" || queueIndex == -1 || queue.length == 0) return;
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        });
    
        const data = await response.json();
        return data.item.uri;
      } catch (error) {
        console.error('Error getting current track:', error);
    }
}

// Start polling
setInterval(checkTrackEnd, interval);
