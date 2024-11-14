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
const lightColorList = ['#F9FBF2', '#F9E7E7', '#C7CCB9', '#FFFFFF']
const light = lightColorList[3];
const dark = darkColorList[4];
const theme = createTheme({
    palette: {
      primary: {
          main:  light,
          contrastText: '#b3b3b3',
          hover: 'rgba(221, 198, 182, 0.3)'
      },
      secondary: {
          main: dark
      },
    },
    typography: {
      "fontFamily": `"Plus Jakarta Sans", "Noto Sans", "Montserrat", "Roboto", "Helvetica", "Arial", sans-serif`,
      allVariants: {
        color: light
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
        MuiTextField: {
            styleOverrides: {
                root: {
                    borderRadius: "5px",
                },
            }
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                    color: dark, // Global input text color
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: dark, // Default color for all labels
                    '&.Mui-focused': {
                    color: dark, // Color when focused
                    },
                },
            },
        },
    },
    
  });
  
  export default theme;