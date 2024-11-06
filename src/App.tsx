import { useEffect, useState } from 'react';
import { Box, TextField, ThemeProvider } from '@mui/material';
import theme from './theme';

const CLIENT_ID = '8fdde060b8c64993b8f965511f1eeed1';
const redirectUri = chrome.identity.getRedirectURL();

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: unknown;
  }
}

function App() {
  // console.log(redirectUri);
  const [query, setQuery] = useState("");
  const [accessToken, setAccessToken] = useState("")
  const [tracks, setTracks] = useState<any[]>([]);
  const [playing, setPlaying] = useState<any>(null);

  // console.log(query);
  // console.log("Access Token: " + accessToken);
  // useEffect(() => { // fetch spotify api access token
  //   let authParameters = {
  //     method: 'POST',
  //     headers: {
  //       'Content-type': 'application/x-www-form-urlencoded'
  //     },
  //     body: 'grant_type=client_credentials&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET
  //   }
  //   fetch("https://accounts.spotify.com/api/token", authParameters)
  //     .then(res => res.json())
  //     .then(data => setAccessToken(data.access_token))
  // }, []);

  useEffect(() => { // authorize user and get access token 
    console.log("got here");
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
        console.log("access token set to " + arr[1]);
      }
    });
  }, [])
  useEffect(() => { // set up player and detect when song ends
    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = 'YOUR_ACCESS_TOKEN';
      const player = new Spotify.Player({
        name: 'My Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });
    
      // Connect to the player
      player.connect();
    
      // Event listener for when the playback state changes
      player.addListener('player_state_changed', (state) => {
        if (!state) return;
    
        const { position, duration, paused } = state;
    
        // Check if the song has ended
        if (position === 0 && paused === true) {
          console.log('Song ended');
          // Trigger any action you'd like here
        }
      });
    
      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        console.error(message);
      });
      player.addListener('authentication_error', ({ message }) => {
        console.error(message);
      });
      player.addListener('account_error', ({ message }) => {
        console.error(message);
      });
      player.addListener('playback_error', ({ message }) => {
        console.error(message);
      });
    };
  }, [accessToken])

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
    const fetchPlaying = async () => {
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
    fetchPlaying();
    
  }, [playing])
  return (
    <ThemeProvider theme={theme}>
      <Box>
        <TextField sx={{color: 'primary.main'}} label="Enter Song" variant="filled" defaultValue={""} onChange={(e) => setQuery(e.currentTarget.value)}>
          
        </TextField>
        <Box overflow={'auto'} height={'10rem'}>
          {!tracks.length ? null :
            tracks.map((element) => {
              return (<Box sx={{cursor: 'pointer', mt: '1rem'}} onClick = {() => setPlaying(element)}>{element.artists[0].name}</Box>)
            })
            // tracks[0].artists[0].name
          }
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
