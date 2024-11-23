import { Box, Typography } from "@mui/material";
import React, { useState } from "react";

interface TrackProps {
    queue: unknown[];
    queueIndex: number;
    setQueueIndex: React.Dispatch<React.SetStateAction<number>>;
    setQueue: React.Dispatch<React.SetStateAction<unknown[]>>;
    ind: number;
    trackInfo: any;
    isDragging: boolean;
    setIsDragging: (arg0: boolean) => void;
    setPlaying: (arg0: boolean) => void;
    isSpotifyActive: boolean;
}

const Track: React.FC<TrackProps> = ({queue, queueIndex, setQueueIndex, setQueue, ind, trackInfo, isDragging, setIsDragging, setPlaying, isSpotifyActive}) => {
    const [isHovered, setIsHovered] = useState(false);
    function timeConversion(millis: number) : string{
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (Number(seconds) < 10 ? '0' : '') + seconds;
    }

    function handleArtistQuery(){
        chrome.tabs.create({url: trackInfo.artists[0]["external_urls"].spotify});
    }

    function handleAlbumQuery(){
        chrome.tabs.create({url: trackInfo.album["external_urls"].spotify});
    }

    return <Box className="track" onDragStart={() => setIsDragging(true)} sx={{display: 'flex', gap: '0.5rem', height: '3.5rem', pt: '0.5rem', padding: '0.5rem', '&:hover': !isDragging ? {opacity: 0.8, bgcolor: 'primary.hover'} : null}}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>

        <Box component="img" sx={{maxHeight: '100%', width: 'auto', cursor: 'pointer'}} src={trackInfo.album.images[2].url} onClick = {async () => {
        if(!isSpotifyActive) return;
        await chrome.storage.local.set({queueIndex: ind})
        const {nextTrack} = await chrome.storage.local.get(["nextTrack"]);
        await chrome.storage.local.set({nextTrack: !nextTrack || nextTrack == -1 ? 1 : -1});
        setPlaying(true);
        }}/>
        <Box className = "song-info" sx={{flex: 1, display: 'flex', gap: '1rem', minWidth: 0, alignItems: 'center', '& .MuiTypography-root': {fontSize: '0.6rem'}}}>
            <Box sx={{width: '40%'}}>
                <Typography noWrap sx={{fontSize: '0.7rem !important', color: queueIndex == ind ? '#1DB954' : null, height: '50%', textOverflow: 'ellipsis'}} align="left">{trackInfo.name}</Typography>
                <Typography sx={{fontSize: '0.65rem !important', color: "primary.contrastText", height: '50%', 
                    "&:hover":{textDecoration: 'underline'}, cursor: 'pointer'}} align="left" onClick={() => handleArtistQuery()}>{trackInfo.artists[0].name}</Typography>
            </Box>
            <Box sx={{flex: '1', display: 'flex', justifyContent: 'space-between'}}>
                <Typography color="primary.contrastText" sx={{display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', 
                maxWidth: '80%', "&:hover":{textDecoration: 'underline'}, cursor: 'pointer'}} align="left"
                 onClick={() => handleAlbumQuery()}>
                    {trackInfo.album.name}
                </Typography>
                <Typography color="primary.contrastText">{timeConversion(trackInfo.duration_ms)}</Typography>
            </Box>
            <Box className="fa-solid fa-xmark" sx={{cursor: 'pointer', fontSize: '0.8rem', mt: '2px', ml: '0.5rem', opacity: !isHovered || isDragging ? 0 : null}} onClick={() => {
                if(isHovered){
                    if(ind < queueIndex) setQueueIndex(queueIndex - 1);
                    else if(ind == queueIndex) setQueueIndex(-1);
                    setQueue(queue.toSpliced(ind, 1));
                }
            }}></Box>
        </Box>
        
    </Box>
}

export default Track;