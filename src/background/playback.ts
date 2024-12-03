import {getAccessToken, refreshAccessToken} from '../authenticate'
console.log = function () {};
console.log("new service worker instance started");

interface Track {
  uri: string;
  // other properties
}

const interval = 1000; 
let accessToken = ""; 
let queueIndex = -1;
let queue: Track[] = [];
let isRunning = false;
chrome.storage.local.set({nextTrack: 1});


const refreshServiceWorker = async () => {
  console.log("service worker refreshed!");
  await refreshAccessToken();
}

const keepRefresh = () => { // refresh access token every 2000 seconds
  setInterval(refreshServiceWorker, 2000 * interval)
}

chrome.storage.local.get({accessToken: "", queueIndex: -1, queue: []}, (data) => {
    accessToken = data.accessToken;
    queueIndex = data.queueIndex;
    queue = data.queue;
})

chrome.storage.onChanged.addListener(async (changes, areaName) => {
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
        }
        else if(key == "nextTrack"){
          await changePlaying();
        }
        else if(key == "queue"){
            queue = newValue;
        }
      }
    }
  });

const changePlaying = async () => {
  console.log("playing is being changed...");
    const playingParameters = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + await getAccessToken()
      },
      body: JSON.stringify({
        'uris': [queue[queueIndex].uri],
        'position_ms': 0
      })
    }
    const response = await fetch('https://api.spotify.com/v1/me/player/play', playingParameters);
    console.log(response.status, response.statusText);
    console.log([queue[queueIndex].uri]);
  }

const checkTrackEnd = async () => {
  try {
    console.log("checking track end...");
    if(isRunning) return; // no coexisting requests
    isRunning = true;

    const isSpotifyActive = await checkSpotifyPlayback();
    if(!isSpotifyActive) return;
    
    console.log("access token: " + accessToken);
    if(!accessToken || accessToken == "" || queueIndex == -1 || queue.length == 0) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const awake = getAccessToken();

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
        const {nextTrack} = await chrome.storage.local.get(['nextTrack']);
        await chrome.storage.local.set({queueIndex: (queueIndex + 1) % queue.length});
        await chrome.storage.local.set({nextTrack: nextTrack == -1 ? 1 : -1});
      }
      else console.log('Playback is paused or stopped:');
    }
    else {
        console.log('Track is still playing');
    }
  } catch (error) {
    console.error('Error checking track state:', JSON.stringify(error));
  } finally {
    isRunning = false;
  }
};

const checkSpotifyPlayback = async () => {
  const response = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (response.status === 204) {
    console.log('No active Spotify instance detected.');
    return false; // No active playback
  } else if (response.ok) {
    return true
  } else {
    console.error('Error fetching playback state:', response.status, await response.text());
    return null; // Error occurred
  }
}

// initiate processes
const startApp = async () => {
  console.log("app started!");
  // Start polling
  await refreshAccessToken();
  const tempToken = await getAccessToken();
  if(!tempToken || tempToken == "") return;
  setInterval(checkTrackEnd, interval);
  keepRefresh();
}

startApp();
