import './App.css'
import { useEffect, useState } from 'react';
import { Box, TextField } from '@mui/material';

const CLIENT_ID = '8fdde060b8c64993b8f965511f1eeed1';
const CLIENT_SECRET = 'ce219faab4684973af81ecb421ca1922';

function App() {
  const [query, setQuery] = useState("Pure Souls");
  const [accessToken, setAccessToken] = useState("")
  const [tracks, setTracks] = useState<any[]>([]);
  const [playing, setPlaying] = useState<any>(null);

  console.log(query);
  console.log("Access Token: " + accessToken);
  useEffect(() => { // fetch spotify api access token
    let authParameters = {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET
    }
    fetch("https://accounts.spotify.com/api/token", authParameters)
      .then(res => res.json())
      .then(data => setAccessToken(data.access_token))
  }, []);

  useEffect(() => { // change displayed tracks on search change
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

  useEffect(() => {
    if(playing == null) return;
    const fetchPlaying = async () => {
      let playingParameters = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        data: {
          'uris': [playing.uri]
        }
      }
      const response = await fetch('https://api.spotify.com/v1/me/player/play', playingParameters);
      console.log(response.status, response.statusText)
    }
    fetchPlaying();
    
  }, [playing])
  return (
    <Box>
      <TextField defaultValue={"Pure Souls"} onChange={(e) => setQuery(e.currentTarget.value)}>
        
      </TextField>
      <Box>
        {!tracks.length ? null :
          tracks.map((element) => {
            return (<Box onClick = {() => setPlaying(element)}>{element.artists[0].name}</Box>)
          })
          // tracks[0].artists[0].name
        }
      </Box>
    </Box>
  )
}

export default App
