import React, { useState } from "react";
import { Container, Box, Text, Input, Button, VStack, FormControl, FormLabel } from "@chakra-ui/react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const submitHandler = async () => {
    if (!email) {
      toast({ title: "Please enter your email", status: "warning", position: "bottom" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/user/forgot-password", { email });
      toast({ title: "Reset code sent", description: data.message, status: "success", position: "bottom" });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Something went wrong",
        status: "error",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="xl">
      <Box
        w="100%"
        m="40px 0px 15px"
        borderWidth="1px"
        borderRadius="lg"
        textAlign="center"
        fontFamily="monospace"
        fontSize="3xl"
        className="HomePageBox"
      >
        Reset Password
      </Box>
      <Box w="100%" borderRadius="lg" borderWidth="1px" p={6} backgroundColor="#151515">
        <VStack spacing="10px">
          <FormControl id="email">
            <FormLabel textColor="gray">Email :</FormLabel>
            <Input
              placeholder="mail@example.com"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitHandler()}
            />
          </FormControl>
          <Button colorScheme="green" w="100%" isLoading={loading} onClick={submitHandler}>
            Send Reset Code
          </Button>
          <Text fontSize="sm">
            <Link to="/" style={{ color: "#0077b6" }}>
              Back to login
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default ForgotPassword;