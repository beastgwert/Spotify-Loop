import {useEffect, useState} from 'react';
import {Box, TextField, ThemeProvider} from '@mui/material';
import ReactDragListView from 'react-drag-listview';
import theme from './theme';
import Track from './components/Track';
import { getAccessToken, refreshAccessToken } from './authenticate';
import Controls from './components/Controls';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TrackView from './components/TrackView';
import Header from './components/Header';

const redirectUri = chrome.identity.getRedirectURL();
function App() {
  console.log('popup rerendered! ' + redirectUri);
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [firstRender, setFirstRender] = useState(true);
  const [secondRender, setSecondRender] = useState(true);
  const [focus, setFocus] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpotifyActive, setIsSpotifyActive] = useState(false);

  // authenticate user or refresh token on popup
  useEffect(() => {
    refreshAccessToken();
  }, [])

  // update values on storage change
  useEffect(() => {
    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName === 'local') {
        for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
          console.log(`Storage key "${key}" in chrome.storage.local changed.`);
          console.log('Old value:', oldValue);
          console.log('New value:', newValue);

          // Perform actions based on specific key changes
          if (key == 'queueIndex') {
            console.log('Queue index was changed to ' + newValue);
            setQueueIndex(newValue);
          } 
        }
      }
    });
  }, []);

  // periodically check for active spotify instance
  useEffect(() => {
    setInterval(async () => {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + (await getAccessToken()),
        },
      });

      if (response.status === 204) {
        setIsSpotifyActive(false);
      } else if (response.ok) {
        setIsSpotifyActive(true);
      }
    }, 1e3);
  }, []);

  // initialize values
  useEffect(() => {
    chrome.storage.local.get({ queue: [] }, (data) => {
      setQueue(data.queue);
    });
    chrome.storage.local.get({ queueIndex: -1 }, (data) => {
      setQueueIndex(data.queueIndex);
    });
    chrome.storage.local.get({ isExpanded: false }, (data) => {
      setIsExpanded(data.isExpanded);
    });
  }, []);

  // change displayed tracks on search change
  useEffect(() => {
    console.log('query: ' + query);
    const fetchTrack = async () => {
      let trackParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (await getAccessToken()),
        },
      };
      await fetch(
        'https://api.spotify.com/v1/search?q=' +
          (query == '' ? 'a' : query) +
          '&type=track',
        trackParameters,
      )
        .then((res) => res.json())
        .then((data) => {
          setTracks(data.tracks.items);
        });
    };
    fetchTrack();
  }, [query, focus]);

  // update chrome storage when queue changes
  useEffect(() => {
    // the only way to change content of queue is using the popup, so it is handled directly
    if (firstRender) {
      setFirstRender(false);
      return;
    }
    if (secondRender) {
      setSecondRender(false);
      return;
    }
    chrome.storage.local.set({ queue: queue });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  function addTrack(track: any) {
    const temp = [...queue];
    temp.push(track);
    setQueue(temp);
  }

  // Handle drag-and-drop reorder
  const onDragEnd = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= queue.length || fromIndex === toIndex) {
      return; // Ignore invalid moves
    }

    const updatedQueue = [...queue];
    const [movedTrack] = updatedQueue.splice(fromIndex, 1);
    updatedQueue.splice(toIndex, 0, movedTrack);

    if (fromIndex == queueIndex) chrome.storage.local.set({queueIndex: toIndex});
    else if (
      fromIndex < toIndex &&
      queueIndex > fromIndex &&
      queueIndex <= toIndex
    ) {
      chrome.storage.local.set({ queueIndex: queueIndex - 1 });
    } else if (
      fromIndex > toIndex &&
      queueIndex < fromIndex &&
      queueIndex >= toIndex
    ) {
      chrome.storage.local.set({ queueIndex: queueIndex + 1 });
    }
    setQueue(updatedQueue);
    setIsDragging(false);
  };

  return (
    <ThemeProvider theme={theme}>
      {!focus ? null : (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10,
          }}
          onClick={() => setFocus(false)}
        ></Box>
      )}
      <Box
        sx={{
          display: 'flex',
          bgcolor: 'secondary.main',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Header isSpotifyActive={isSpotifyActive}></Header>
          <Box
            sx={{ mt: '1rem', width: '90%', position: 'relative', zIndex: 15 }}
          >
            <TextField
              sx={{
                color: 'secondary.main',
                bgcolor: 'primary.main',
                width: '100%',
                borderBottom: '0.5px solid black',
                borderBottomLeftRadius: focus ? 0 : null,
                borderBottomRightRadius: focus ? 0 : null,
              }}
              value={query}
              label="Find a song"
              variant="filled"
              defaultValue={''}
              onChange={(e) => {
                setQuery(e.currentTarget.value);
              }}
              onFocus={() => setFocus(true)}
            ></TextField>
            {!focus ? null : (
              <Box
                overflow={'auto'}
                sx={{
                  zIndex: 15,
                  width: '100%',
                  maxHeight: '15rem',
                  bgcolor: 'white',
                  position: 'absolute',
                  borderRadius: '0 0 5px 5px',
                }}
              >
                {!tracks.length
                  ? null
                  : tracks.map((element) => {
                      return (
                        <Box
                          sx={{
                            color: 'secondary.main',
                            cursor: 'pointer',
                            pt: '0.5rem',
                            pb: '0.5rem',
                            zIndex: 15,
                            '&:hover': {
                              opacity: 0.8,
                              bgcolor: 'primary.hover',
                            },
                          }}
                          onClick={() => {
                            addTrack(element);
                            setFocus(false);
                            setQuery('');
                          }}
                        >{`${element.name} - ${element.artists[0].name} (${element.album.name})`}</Box>
                      );
                    })}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              mt: '1.5rem',
              width: '90%',
              height: '20rem',
              borderBottom: '0.5px solid white',
              overflow: 'scroll',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <ReactDragListView
              onDragEnd={onDragEnd}
              nodeSelector=".track"
              lineClassName="drag-line"
            >
              {!queue.length
                ? null
                : queue.map((element, i) => {
                    return (
                      <Track
                        queueIndex={queueIndex}
                        queue={queue}
                        setQueue={setQueue}
                        ind={i}
                        trackInfo={element}
                        isDragging={isDragging}
                        setIsDragging={setIsDragging}
                        setPlaying={setPlaying}
                        isSpotifyActive={isSpotifyActive}
                      ></Track>
                    );
                  })}
            </ReactDragListView>
          </Box>
          <TrackView
            queue={queue}
            queueIndex={queueIndex}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          ></TrackView>
          <KeyboardArrowUpIcon
            sx={{ cursor: 'pointer', mt: '1rem' }}
            onClick={async () => {
              await chrome.storage.local.set({
                isExpanded: isExpanded ? false : true,
              });
              setIsExpanded(isExpanded ? false : true);
            }}
          />
        </Box>
        <Controls
          queue={queue}
          queueIndex={queueIndex}
          queueLength={queue.length}
          playing={playing}
          setPlaying={setPlaying}
          isSpotifyActive={isSpotifyActive}
        ></Controls>
      </Box>
    </ThemeProvider>
  );
}

export default App;