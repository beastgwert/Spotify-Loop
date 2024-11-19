import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, TextField, ThemeProvider } from '@mui/material';
import theme from './theme';
import zIndex from '@mui/material/styles/zIndex';
import Track from './components/Track';
import {getAccessToken} from './authenticate'

const redirectUri = chrome.identity.getRedirectURL();
function App() {
  console.log("popup rerendered! " + redirectUri);
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [playing, setPlaying] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1); 
  const [firstRender, setFirstRender] = useState(true);
  const [secondRender, setSecondRender] = useState(true);
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    chrome.storage.local.get({queue: []}, (data) => {
      setQueue(data.queue);
    })
    chrome.storage.local.get({queueIndex: -1}, (data) => {
      setQueueIndex(data.queueIndex);
    })
  }, [])
  // useEffect(() => {
  //   authenticate()
  // }, [authenticate]);

  // change displayed tracks on search change
  useEffect(() => { 
    console.log("query: " + query)
    // if(query == ""){
    //   setTracks([]);
    //   return;
    // }
    const fetchTrack = async () => {
      let trackParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + await getAccessToken()
        }
      }
      let trackID = await fetch('https://api.spotify.com/v1/search?q=' + (query == "" ? "a" : query) + '&type=track', trackParameters)
        .then(res => res.json())
        .then(data => {
          setTracks(data.tracks.items);
          console.log(data);
          console.log(data.tracks.items[0].artists[0]);
        });
    }
    fetchTrack();
  }, [query, focus])

  // update chrome storage when queue changes
  useEffect(() => { 
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
  }, [queue])

  // update current playing song index
  useEffect(() => { 
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

  const changePlaying = async () => {
    console.log("playing is being changed...");
    let playingParameters = {
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
    
  return (
    <ThemeProvider theme={theme}>
      {!focus ? null : <Box sx={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(0, 0, 0, 0.6)', zIndex: 10}} onClick = {() => setFocus(false)}></Box>}
      <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Box sx={{width: '90%', position: 'relative', zIndex: 15}}>
          <TextField sx={{color: 'secondary.main', bgcolor: 'primary.main', width: '100%', borderBottom: '0.5px solid black', borderBottomLeftRadius: focus ? 0 : null, borderBottomRightRadius: focus ? 0 : null}} value={query} label="Find a song" variant="filled" defaultValue={""} onChange={(e) => {
            setQuery(e.currentTarget.value);
          }} onFocus={() => setFocus(true)}>
          </TextField>
          {!focus ? null :
          <Box overflow={'auto'} sx={{zIndex: 15, width: '100%', maxHeight: '10rem', bgcolor: 'white', position: 'absolute', borderRadius: '0 0 5px 5px'}}>
            {!tracks.length ? null :
              tracks.map((element) => {
                return (<Box sx={{color: 'secondary.main', cursor: 'pointer', pt: '0.5rem', pb: '0.5rem', zIndex: 15, '&:hover': {opacity: 0.8, bgcolor: 'primary.hover'}}} onClick = {() => {
                  addTrack(element);
                  setFocus(false);
                  setQuery('');
                }}>{`${element.name} - ${element.artists[0].name}`}</Box>)
              })
              // tracks[0].artists[0].name
            }
          </Box>
          }
        </Box>
        <Box sx={{mt: "2rem", width: '90%', height: '20rem', overflow:'scroll', '&::-webkit-scrollbar': {display: 'none'}}}>
          {!queue.length ? null :
            queue.map((element, i) => {
              return <Track 
              queueIndex={queueIndex}
              setQueueIndex={setQueueIndex}
              queue={queue}
              setQueue={setQueue}
              changePlaying={changePlaying}
              ind={i}
              trackInfo={element}></Track>
          })}
        </Box>
        <Button sx={{p: 2}} onClick={() => {setQueue([])}}>Clear</Button>
      </Box>
    </ThemeProvider>
  )
}

export default App
