import { Box, Typography } from "@mui/material";
import React, { useState } from "react";

interface TrackProps {
    queue: unknown[];
    queueIndex: number;
    setQueueIndex: React.Dispatch<React.SetStateAction<number>>;
    setQueue: React.Dispatch<React.SetStateAction<unknown[]>>;
    changePlaying: () => void;
    ind: number;
    trackInfo: any;
}
const Track: React.FC<TrackProps> = ({queue, queueIndex, setQueueIndex, setQueue, changePlaying, ind, trackInfo}) => {
    const [isHovered, setIsHovered] = useState(false);
    function timeConversion(millis: number) : string{
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (Number(seconds) < 10 ? '0' : '') + seconds;
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
      
    return <Box sx={{display: 'flex', gap: '0.5rem', height: '3.5rem', pt: '0.5rem', padding: '0.5rem', '&:hover': {opacity: 0.8, bgcolor: 'primary.hover'}}} onClick = {async () => {
        console.log("ind: " + ind);
        setQueueIndex(ind); 
        let temp = await getLocalStorage('nextTrack');
        console.log("nextTrack: " + temp);
        await setStorageData({nextTrack: temp == -1 ? 1 : -1});
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <Box component="img" sx={{maxHeight: '100%', width: 'auto'}} src={trackInfo.album.images[2].url}/>
        <Box className = "song-info" sx={{flex: 1, display: 'flex', alignItems: 'center', '& .MuiTypography-root': {fontSize: '0.6rem', cursor: 'default'}}}>
            <Box sx={{width: '40%'}}>
                <Typography fontSize={"1rem"} align="left">{trackInfo.name}</Typography>
                <Typography color="primary.contrastText" align="left">{trackInfo.artists[0].name}</Typography>
            </Box>
            <Box sx={{flex: '1', display: 'flex', justifyContent: 'space-between'}}>
                <Typography color="primary.contrastText">{trackInfo.album.name}</Typography>
                <Typography color="primary.contrastText">{timeConversion(trackInfo.duration_ms)}</Typography>
            </Box>
            <Box className="fa-solid fa-xmark" sx={{cursor: 'pointer', fontSize: '0.8rem', mt: '2px', ml: '0.5rem', opacity: !isHovered ? 0 : null}} onClick={() => {
                if(isHovered) setQueue(queue.toSpliced(ind, 1));
            }}></Box>
        </Box>
        
    </Box>
}

export default Track;