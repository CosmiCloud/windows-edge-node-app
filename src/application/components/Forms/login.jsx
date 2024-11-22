import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import ColorModeToggle from "../Toggles/colorModeToggle"; 

const LoginPage = ({setUserInfo, app_config}) => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const allowSignup = process.env.REACT_APP_AUTH_ALLOW_SIGNUP === "true";
  const allowPasswordReset = process.env.REACT_APP_AUTH_ALLOW_PASSWORD_RESET === "true";
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const loginSubmit = async (e) => {
    e.preventDefault();
    try {
      let message_obj = {
        TYPE: "log-in",
        form: form,
        withCredentials: true
      };

      const response = await window.api.invoke(`${app_config.app_name}-service`, message_obj);

      if (response?.user) {
        setUserInfo(response);
      } else {
        toast({
          title: "Unable to authenticate",
          description: "Invalid credentials!",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Unable to authenticate",
        description: err?.response?.status === 400 || err?.response?.status === 401
          ? "Invalid credentials!"
          : err?.message || "Unknown error.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex justify="center" align="center" height="100vh" position="relative">
      <Box
        as="form"
        onSubmit={loginSubmit}
        p={8}
        rounded="lg"
        boxShadow="lg"
        w="100%"
        maxW="400px"
        bg={useColorModeValue("gray.50", "gray.700")} // Slightly different color for the box
        className="login-box"
      >
        <VStack spacing={4} align="stretch">
          <Heading as="h1" size="lg" color="teal.500" textAlign="center">
            Login
          </Heading>
          <Text color="gray.500" textAlign="center">
            Enter your details to get started.
          </Text>
          <FormControl id="username" isRequired>
            <Input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleInputChange}
            />
          </FormControl>
          <FormControl id="password" isRequired>
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleInputChange}
            />
          </FormControl>
          <Checkbox
            isChecked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            colorScheme="teal"
          >
            Remember me
          </Checkbox>
          <VStack spacing={3} align="stretch">
            <Button type="submit" colorScheme="teal" size="lg" rounded="full">
              Login
            </Button>
            {allowSignup && (
              <Button colorScheme="teal" variant="outline" size="lg" rounded="full">
                Sign up
              </Button>
            )}
            {allowPasswordReset && (
              <Button variant="link" colorScheme="teal">
                Forgot password?
              </Button>
            )}
          </VStack>
        </VStack>
      </Box>

      {/* Color Mode Toggle positioned at bottom right */}
      <Box position="absolute" bottom={4} right={4} p={2}>
        <ColorModeToggle />
      </Box>
    </Flex>
  );
};

export default LoginPage;
