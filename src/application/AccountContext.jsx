import React, { createContext, useState } from "react";

// Define the context
export const AccountContext = createContext({
  user_info: null,
  setUserInfo: () => {},
  app_config: null,
  setAppConfig: () => {},
  key_config: null,
  setKeyConfig: () => {},
});

// Create the provider
export const AccountProvider = ({ children }) => {
  const [user_info, setUserInfo] = useState(null);
  const [app_config, setAppConfig] = useState(null);
  const [key_config, setKeyConfig] = useState(null);

  return (
    <AccountContext.Provider
      value={{
        user_info,
        setUserInfo,
        app_config,
        setAppConfig,
        key_config,
        setKeyConfig,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
