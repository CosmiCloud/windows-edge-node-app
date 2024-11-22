import React from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { AccountProvider } from "./AccountContext";
import { ColorModeScript } from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <ChakraProvider theme={theme}>
    <ColorModeScript />
    <AccountProvider>
      <App />
    </AccountProvider>
  </ChakraProvider>
);
