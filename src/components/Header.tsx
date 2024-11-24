import { Box, Tooltip } from "@mui/material";
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
interface HeaderProps {
    isSpotifyActive: boolean;
}

const Header: React.FC<HeaderProps> = ({isSpotifyActive}) => {

    function handleSpotifyQuery() {
        chrome.tabs.create({ url: "https://open.spotify.com"});
    }

    return(
        <Box sx={{padding: '0.5rem', width: '100%', display: 'flex', justifyContent: 'space-between'}}>
            <Box className="fa-brands fa-spotify" sx={{cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center'}} onClick={() => handleSpotifyQuery()}></Box>
            
            {isSpotifyActive ? 
            <Tooltip title="Connected">
                <WifiIcon sx={{ color: '#1DB954', fontSize: '1rem'}}></WifiIcon>
            </Tooltip>
            :
            <Tooltip title="No active spotify">
                <WifiOffIcon sx={{ color: '#f5765b', fontSize: '1rem'}}></WifiOffIcon>
            </Tooltip>
            }
        </Box>
    )
}

export default Header;