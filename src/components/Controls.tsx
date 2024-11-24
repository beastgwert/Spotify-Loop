import { Box } from '@mui/material';
import { useEffect } from 'react';
import { getAccessToken } from '../authenticate';

interface ControlsProps {
  queue: unknown[];
  queueIndex: number;
  queueLength: number;
  playing: boolean;
  setPlaying: (arg0: boolean) => void;
  isSpotifyActive: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  queueIndex,
  queueLength,
  playing,
  setPlaying,
  isSpotifyActive,
}) => {
  useEffect(() => {
    const initialPlaying = async () => {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          Authorization: 'Bearer ' + (await getAccessToken()),
        },
      });
      const data = await response.json();
      setPlaying(data.is_playing);
    };
    initialPlaying();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumePlay = async () => {
    if (!isSpotifyActive) return;
    const playingParameters = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer ' + (await getAccessToken()),
      },
    };
    await fetch('https://api.spotify.com/v1/me/player/play', playingParameters);
    setPlaying(true);
  };

  const pausePlay = async () => {
    if (!isSpotifyActive) return;
    const playingParameters = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer ' + (await getAccessToken()),
      },
    };
    await fetch(
      'https://api.spotify.com/v1/me/player/pause',
      playingParameters,
    );
    setPlaying(false);
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        mt: '1rem',
      }}
    >
      <Box
        sx={{
          width: '100%',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '5rem',
          '& .MuiBox-root': { cursor: 'pointer' },
        }}
      >
        <Box
          className="fa-solid fa-backward-step"
          sx={{
            fontSize: '1.5rem',
            color: '#656565',
            '&:hover': { color: 'primary.main' },
          }}
          onClick={async () => {
            if (!isSpotifyActive) return;
            await chrome.storage.local.set({
              queueIndex: (queueIndex - 1 + queueLength) % queueLength,
            });
            const { nextTrack } = await chrome.storage.local.get(['nextTrack']);
            await chrome.storage.local.set({
              nextTrack: !nextTrack || nextTrack == -1 ? 1 : -1,
            });
          }}
        ></Box>
        {!playing ? (
          <Box
            className="fa-solid fa-circle-play"
            sx={{
              fontSize: '2rem',
              '&:hover': { fontSize: '2.1rem' },
              position: 'absolute',
              transform: 'translate(-50%, -50%',
            }}
            onClick={() => {
              resumePlay();
            }}
          ></Box>
        ) : (
          <Box
            className="fa-solid fa-circle-pause"
            sx={{
              fontSize: '2rem',
              '&:hover': { fontSize: '2.1rem' },
              position: 'absolute',
              transform: 'translate(-50%, -50%',
            }}
            onClick={() => {
              pausePlay();
            }}
          ></Box>
        )}
        <Box
          className="fa-solid fa-forward-step"
          sx={{
            fontSize: '1.5rem',
            color: '#656565',
            '&:hover': { color: 'primary.main' },
          }}
          onClick={async () => {
            if (!isSpotifyActive) return;
            await chrome.storage.local.set({
              queueIndex: (queueIndex + 1) % queueLength,
            });
            const { nextTrack } = await chrome.storage.local.get(['nextTrack']);
            await chrome.storage.local.set({
              nextTrack: !nextTrack || nextTrack == -1 ? 1 : -1,
            });
          }}
        ></Box>
      </Box>
    </Box>
  );
};

export default Controls;
