import { createTheme } from "@mui/material";

declare module '@mui/material/styles' {
    interface PaletteColor{
        hover?: string;
    }
    
    interface SimplePaletteColorOptions {
        hover?: string;
    }
  }

const darkColorList = ['#250001', 'rgb(17 24 39)', '#151515', '#3A2E39', '#32322C'];
const lightColorList = ['#F9FBF2', '#F9E7E7', '#C7CCB9']
const light = lightColorList[1];
const dark = darkColorList[4];
const theme = createTheme({
    palette: {
      primary: {
          main:  light,
          hover: 'rgba(221, 198, 182, 0.1)'
      },
      secondary: {
          main: dark
      },
    },
    typography: {
      "fontFamily": `"Noto Sans", "Montserrat", "Roboto", "Helvetica", "Arial", sans-serif`,
      allVariants: {
        color: dark
      },   
      button: {
        textTransform: 'none'
      }
    },
    components: { // custom styling for components
        MuiButtonBase: {
            defaultProps: {
                disableRipple: true,
            },
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                color: light, // Global input text color
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: light, // Default color for all labels
                    '&.Mui-focused': {
                    color: light, // Color when focused
                    },
                },
            },
        },
    },
    
  });
  
  export default theme;