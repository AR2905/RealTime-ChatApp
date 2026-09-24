import React, { useState } from "react";
import { Input, VStack } from "@chakra-ui/react";
import { FormControl, FormLabel } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";

import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitHandler = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({
        title: "Please Fill all the Feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/user/login",
        { email, password },
        config
      );

      toast({
        title: "Login Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      navigate("/chats");
      setLoading(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <VStack spacing={"10px"}>
        <FormControl id="email">
          <FormLabel textColor={"gray"}>Email :</FormLabel>

          <Input
            placeholder="mail@example.com"
            type="text"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            value={email}
          ></Input>
        </FormControl>

        <FormControl id="password">
          <FormLabel textColor={"gray"}>Password :</FormLabel>

          <Input
            placeholder="Enter Password..."
            type="password"
            onChange={(e) => {
              setPass(e.target.value);
            }}
            value={password}
          ></Input>
        </FormControl>

        <Button
          colorScheme="green"
          w={"100%"}
          onClick={submitHandler}
          isLoading={loading}
        >
          Login
        </Button>

        <Button
          colorScheme="telegram"
          w={"100%"}
          onClick={() => {
            setPass(123456);
            setEmail("guest@gmail.com");
          }}
        >
          Guest Login
        </Button>
      </VStack>
    </>
  );
};

export default Login;
