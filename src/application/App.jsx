import React, { useContext, useEffect } from "react";
import { Box } from "@chakra-ui/react";
import log from "electron-log";
import Login from "./components/Forms/login";
import ChangeCredentials from "./components/Forms/change_credentials";
import Main from "./components/Main";
import { AccountContext } from "./AccountContext";

const App = () => {
  const {
    user_info,
    setUserInfo,
    app_config,
    setAppConfig,
    key_config,
    setKeyConfig,
  } = useContext(AccountContext);

  const fetchConfig = async () => {
    try {
      log.info("Getting configs...");
      const app_cfg = await window.api.invoke("get-config", "app");
      const key_cfg = await window.api.invoke("get-config", "keys");
      setAppConfig(app_cfg);
      setKeyConfig(key_cfg);
    } catch (e) {
      console.error(`Error fetching config data: ${e}`);
      toast({
        title: "Error fetching configuration",
        description: e.message || "Unable to load configuration.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <Box w="100%" h="100vh" display="flex">
      <Box flex="1" h="100%">
        {user_info ? (
          user_info.user.username === "admin" ? (
            <ChangeCredentials setUserInfo={setUserInfo} app_config={app_config} />
          ) : (
            <Main
                setUserInfo={setUserInfo}
                user_info={user_info}
                app_config={app_config}
                key_config={key_config}
              />
          )
        ) : (
          <Login setUserInfo={setUserInfo} app_config={app_config}/>
        )}
      </Box>
    </Box>
  );
};

export default App;
