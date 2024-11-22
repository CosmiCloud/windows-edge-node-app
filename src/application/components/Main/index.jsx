import React from "react";
import { Box, Text, Center } from "@chakra-ui/react";
import ColorModeToggle from "../Toggles/colorModeToggle";
import NavBar from "../NavBar";

const Main = ({ setUserInfo, user_info, app_config, key_config }) => {
  return (
    user_info &&
    app_config &&
    key_config && (
      <Box h="100%">
        <NavBar app_config={app_config} user_info={user_info} setUserInfo={setUserInfo}/>
        <Center>
          <Box
            borderWidth={2}
            borderColor="gray.400"
            borderRadius="md"
            boxShadow="md"
            p={4}
            w="80%"
            maxW="1200px"
            h="80vh"
            overflow="auto"
            display="flex"
          >
            <Text>Authenticated user!</Text>
            <Text>User configs: {JSON.stringify(user_info)} </Text>
            <Text>Session cookie: {JSON.stringify(user_info.cookie)} </Text>
            <Text>App config: {JSON.stringify(app_config)} </Text>
            <Text>Wallet keys: {JSON.stringify(key_config)} </Text>
          </Box>
        </Center>
        <Box position="absolute" bottom={4} right={4} p={2}>
          <ColorModeToggle />
        </Box>
      </Box>
    )
  );
};

export default Main;
