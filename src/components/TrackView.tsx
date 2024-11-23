import { Box, Typography } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useEffect, useState } from "react";

// @ts-expect-error
import ColorThief from '../../node_modules/colorthief/dist/color-thief.mjs';

interface TrackViewProps {
    queue: unknown[];
    queueIndex: number;
    isExpanded: boolean;
    setIsExpanded: (arg0: boolean) => void;
}

const TrackView: React.FC<TrackViewProps> = ({queue, queueIndex, isExpanded, setIsExpanded}) => {

  let trackInfo: any = queueIndex == -1 ? null : queue[queueIndex];
  const [bgColor, setBgColor] = useState('#32322C');

  useEffect(() => {
    if(queueIndex == -1) return;
    trackInfo = queue[queueIndex];
    console.log("this is the image url: " + trackInfo.album.images[0].url + " " + queueIndex);
    const updateBgColor = async () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = trackInfo.album.images[0].url;
      
      img.onload = async () => {
        let colorThief = new ColorThief();
        const dominantColor = await colorThief.getColor(img);
        const rgbColor = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
        setBgColor(rgbColor);
      }
    }
    updateBgColor();
  }, [queueIndex]);

  return (
      <Box
      sx={{
        position: 'absolute',
        zIndex: 20, 
        bottom: isExpanded ? 0 : '-100%',
        left: 0,
        width: '100%',
        height: '100%',
        background: `linear-gradient(to bottom, ${bgColor}, #191414)`,
        transition: 'bottom 0.5s ease',
      }}
    >
      <Box sx={{width: '100%', height: '100%', padding: '1rem', position: 'relative'}}>
        <KeyboardArrowDownIcon sx={{position: "absolute", top: 0, left: '50%', transform: 'translateX(-50%)', cursor: 'pointer'}} onClick={async () => {
          console.log("pressed!");
          await chrome.storage.local.set({isExpanded: isExpanded ? false : true});
          setIsExpanded(isExpanded ? false : true);
        }}/>
        {queueIndex == -1 ? null :
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', mt: '2rem'}}>
            <Box component="img" sx={{width: '80%', height: 'auto', borderRadius: '5px'}} src={trackInfo.album.images[0].url}></Box>
            <Typography noWrap sx={{fontWeight: 'bold', fontSize: '1.5rem', mt: '0.2rem', maxWidth: '100%'}}>{trackInfo.name}</Typography>
            <Typography sx={{fontWeight: 'light', fontSize: '0.8rem'}}>{trackInfo.artists[0].name}</Typography>
        </Box>
        
        }
      </Box>
    </Box>
  )
}

export default TrackView;