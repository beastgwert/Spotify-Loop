import { useEffect, useRef, useState } from 'react';
import { Box, Button, TextField, ThemeProvider } from '@mui/material';
import theme from './theme';

const CLIENT_ID = '8fdde060b8c64993b8f965511f1eeed1';
const redirectUri = chrome.identity.getRedirectURL();

function App() {
  // console.log(redirectUri);
  const [query, setQuery] = useState("");
  const [accessToken, setAccessToken] = useState("")
  const [tracks, setTracks] = useState<any[]>([]);
  const [playing, setPlaying] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1); 
  const [firstRender, setFirstRender] = useState(true);
  const [secondRender, setSecondRender] = useState(true);

  useEffect(() => { // authorize user and get access token 
    console.log("Authorizing user...");
    const scopes = ["user-read-private", "user-read-email", "user-modify-playback-state", "user-read-playback-state"];
    chrome.identity.launchWebAuthFlow({
      "url": `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scopes.join('%20')}`, 
      'interactive': true,  
    }, (redirect_url) => { 
      console.log(redirect_url);
      const rx=/access_token=([^&]*)/;
      const arr = rx.exec(redirect_url ?? "none");
      if(arr != null){
        setAccessToken(arr[1]);
        chrome.storage.local.set({accessToken: arr[1]});
        console.log("access token set to " + arr[1]);
      }
    });

    chrome.storage.local.get({queue: []}, (data) => {
      setQueue(data.queue);
    })
    chrome.storage.local.get({queueIndex: -1}, (data) => {
      setQueueIndex(data.queueIndex);
    })
    
  }, [])

  useEffect(() => { // change displayed tracks on search change
    console.log("query: " + query)
    if(query == ""){
      setTracks([]);
      return;
    }
    const fetchTrack = async () => {
      let trackParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        }
      }
      let trackID = await fetch('https://api.spotify.com/v1/search?q=' + query + '&type=track', trackParameters)
        .then(res => res.json())
        .then(data => {
          setTracks(data.tracks.items);
          console.log(data);
          console.log(data.tracks.items[0].artists[0]);
        });
    }
    fetchTrack();
  }, [query])
  
  useEffect(() => { // Play song when clicked
    if(playing == null) return;
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
          'uris': [playing.uri],
          'position_ms': 0
        })
      }
      const response = await fetch('https://api.spotify.com/v1/me/player/play', playingParameters);
      console.log(response.status, response.statusText);
      console.log([playing.uri]);
    }
    changePlaying();
    
  }, [playing])

  useEffect(() => { // update chrome storage when queue changes
    if(firstRender){
      setFirstRender(false);
      return;
    }
    if(secondRender){
      setSecondRender(false);
      return;
    }
    console.log("queue was changed")
    chrome.storage.local.set({queue: queue})
    chrome.storage.local.set({queueIndex: -1})
  }, [queue])

  useEffect(() => { // update current playing song index
    console.log("firstRender.current: " + firstRender);
    if(firstRender){
      setFirstRender(false);
      return;
    }
    if(secondRender){
      setSecondRender(false);
      return;
    }
    console.log("got to queueIndex set")
    chrome.storage.local.set({queueIndex: queueIndex})
  }, [queueIndex])

  function addTrack(track: any){
    console.log("queue: " + queue)
    const temp = [...queue];
    temp.push(track);
    setQueue(temp);
  }

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <TextField sx={{color: 'primary.main'}} label="Enter Song" variant="filled" defaultValue={""} onChange={(e) => setQuery(e.currentTarget.value)}>
          
        </TextField>
        <Box overflow={'auto'} height={'10rem'}>
          {!tracks.length ? null :
            tracks.map((element) => {
              return (<Box sx={{cursor: 'pointer', mt: '1rem'}} onClick = {() => addTrack(element)}>{element.artists[0].name}</Box>)
            })
            // tracks[0].artists[0].name
          }
        </Box>
        <Box>
          {!queue.length ? null :
            queue.map((element, i) => {
              return (<Box sx={{mt: '0.5rem', cursor: 'pointer'}} onClick = {() => {setQueueIndex(i); console.log("index: " + i)}}>{element.name}</Box>)
            })
            // tracks[0].artists[0].name
          }
        </Box>
        <Button sx={{p: 2}} onClick={() => {setQueue([])}}>Clear</Button>
      </Box>
    </ThemeProvider>
  )
}

export default App
