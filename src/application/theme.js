import { extendTheme } from "@chakra-ui/react";

// Custom theme to handle color mode globally
const theme = extendTheme({
  config: {
    initialColorMode: "light", // You can set this to "dark" if you want dark mode by default
    useSystemColorMode: true,  // Set to true if you want to use the system's color mode preference
  },
  colors: {
    // Define custom colors for each mode
    light: {
      background: "#f7fafc", // Light background color
      text: "#2d3748", // Dark text color
    },
    dark: {
      background: "#1a202c", // Dark background color
      text: "#edf2f7", // Light text color
    },
  },
  styles: {
    global: (props) => ({
      body: {
        backgroundColor: props.colorMode === "light" ? "#f7fafc" : "#1a202c",
        color: props.colorMode === "light" ? "#2d3748" : "#edf2f7",
      },
      "*::placeholder": {
        color: props.colorMode === "light" ? "#a0aec0" : "#718096", // Custom placeholder color
      },
    }),
  },
});

export default theme;
