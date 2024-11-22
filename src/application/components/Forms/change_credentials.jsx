import React, { useState } from "react";
import ColorModeToggle from "../Toggles/colorModeToggle";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";

const ChangeCredentialsPage = ({ setUserInfo, app_config }) => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const changeCredentials = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (form.password !== form.confirm_password) {
        return toast({
          title: "Password Error",
          description: "Passwords do not match.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }

      if (form.username === "admin") {
        return toast({
          title: "Username Error",
          description: "Cannot use default username.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }

      if (form.password === "admin123") {
        return toast({
          title: "Password Error",
          description: "Cannot use default password.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }

      let message_obj = {
        TYPE: "change-credentials",
        form: form,
      };

      let response = await window.api.invoke(
        `${app_config.app_name}-service`,
        message_obj
      );

      if (response && response.error) {
        throw new Error(response.error);
      }

      message_obj = {
        TYPE: "log-in",
        form: form,
        withCredentials: true,
      };

      response = await window.api.invoke(
        `${app_config.app_name}-service`,
        message_obj
      );

      setUserInfo(response.user);
      setLoading(false);
    } catch (err) {
      toast({
        title: "Error! updating credentials!",
        description: err.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  return (
    <Flex
      justify="center"
      align="center"
      height="100vh"
      bg={useColorModeValue("gray.100", "gray.800")}
    >
      <Box
        as="form"
        onSubmit={changeCredentials}
        bg={useColorModeValue("gray.50", "gray.700")} // Slightly different color for the box
        p={8}
        rounded="lg"
        boxShadow="lg"
        w="100%"
        maxW="600px"
        className="login-box"
      >
        <VStack spacing={4} align="stretch">
          <Heading as="h1" size="lg" color="teal.500" textAlign="center">
            Change Credentials
          </Heading>
          <Text color="gray.500" textAlign="center">
            Provide a username and password to login.
          </Text>

          <FormControl id="username" isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleInputChange}
            />
          </FormControl>

          <FormControl id="password" isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleInputChange}
            />
          </FormControl>

          <FormControl id="confirm_password" isRequired>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              value={form.confirm_password}
              onChange={handleInputChange}
            />
          </FormControl>

          <VStack spacing={3} align="stretch">
            <Button
              type="submit"
              colorScheme="teal"
              size="lg"
              rounded="full"
              isLoading={loading}
              loadingText="Registering..."
            >
              Confirm
            </Button>
          </VStack>
        </VStack>
      </Box>

      <Box position="absolute" bottom={4} right={4} p={2}>
        <ColorModeToggle />
      </Box>
    </Flex>
  );
};

export default ChangeCredentialsPage;
