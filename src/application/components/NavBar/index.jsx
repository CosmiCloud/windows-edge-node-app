import React from "react";
import {
  Flex,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

const NavBar = ({setUserInfo, user_info, app_config }) => {
  const handleLogout = () => {
    setUserInfo(null);
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      px={4}
      py={2}
      bg={useColorModeValue("gray.50", "gray.700")}
      color={useColorModeValue("gray.800", "white")} 
      boxShadow="md"
      position="relative"
    >
      <Text fontSize="xl" fontWeight="bold" color={useColorModeValue("teal.500", "teal.200")}>
      {app_config.app_name}
      </Text>

      <Menu>
        <MenuButton
          as={Flex}
          alignItems="center"
          cursor="pointer"
        >
          <Avatar
            size="sm"
            name={user_info?.username || "User"}
            bg="teal.500"
            mr={2}
          />
          <Text mr={2} fontWeight="medium" color={useColorModeValue("gray.800", "white")}>
            {user_info.user?.username}
          </Text>
          <ChevronDownIcon />
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => alert("Settings Clicked")}>Settings</MenuItem>
          <MenuItem onClick={handleLogout}>Log Out</MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default NavBar;
