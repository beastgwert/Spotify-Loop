import {getAccessToken, refreshAccessToken, authenticate} from '../authenticate'

// Automatically check for token refresh on startup
chrome.runtime.onStartup.addListener(async () => {
  const { expiresIn } = await chrome.storage.local.get("expiresIn");
  if (!expiresIn || Date.now() >= expiresIn) {
    await refreshAccessToken();
  }
});

const interval = 1000; // Poll every 1 second
let refreshID = 0;
let accessToken = ""; 
let queueIndex = -1;
let queue: string | any[] = [];
let isRunning = false;
let isInQueue = true;
chrome.storage.local.set({nextTrack: 1});

const refreshServiceWorker = async () => {
  console.log("service worker refreshed!");
  await chrome.runtime.getPlatformInfo;
}
console.log("new service worker instance started");
// const keepAlive = () => { // revive service worker so it doesn't expire
//   console.log("I'm alive!");
//   refreshID = setInterval(refreshServiceWorker, 20e3);
// }

const keepRefresh = () => {
  setInterval(authenticate, 1000 * interval)
}
const checkInQueue = () => { // end service worker if not playing a song in queue
  const checkQueueID = setInterval(async () => {
    const curTrack = await getCurrentTrack();
    console.log("interval check " + curTrack + " " + queue[queueIndex].uri);
    if(curTrack != queue[queueIndex].uri){
      console.log("interval cleared" + curTrack + " " + queue[queueIndex].uri + " " + refreshID);
      isInQueue = false;
      clearInterval(refreshID);
      clearInterval(checkQueueID);
    }
  }, 20e3);
}
// chrome.runtime.onStartup.addListener(keepAlive);
chrome.runtime.onStartup.addListener(keepRefresh);
chrome.runtime.onStartup.addListener(checkInQueue);
// keepAlive();
keepRefresh();
checkInQueue();


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
          if(!isInQueue){
            isInQueue = true;
            checkInQueue();
            // keepAlive();
          }
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
        // 'context_uri': playing.artists[0].uri,
        'uris': [queue[queueIndex].uri],
        'position_ms': 0
      })
    }
    const response = await fetch('https://api.spotify.com/v1/me/player/play', playingParameters);
    console.log(response.status, response.statusText);
    console.log([queue[queueIndex].uri]);
  }

const getLocalStorage = async (key: any) => {
  return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], function (result) {
      if (result[key] === undefined) {
          reject();
      } else {
          resolve(result[key]);
      }
      });
  });
};

const setStorageData = (keyValue: Partial<{ [key: string]: any; }>) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(keyValue, () => {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
        } else {
            resolve(keyValue);
        }
        });
    });
};

const checkTrackEnd = async () => {
  try {
    console.log("isRunning + isInQueue: " +  isRunning + " " + isInQueue);
    if(isRunning || !isInQueue) return;
    isRunning = true;
    accessToken = await getAccessToken();
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
        setStorageData({queueIndex: (queueIndex + 1) % queue.length});
        let temp = await getLocalStorage('nextTrack');
        await setStorageData({nextTrack: temp == -1 ? 1 : -1});
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

const getCurrentTrack = async () => {
    try {
        if(accessToken == "" || queueIndex == -1 || queue.length == 0) return;
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            Authorization: 'Bearer ' + await getAccessToken(),
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
