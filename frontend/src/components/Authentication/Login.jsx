import React, { useState } from "react";
import {
  Input,
  VStack,
  FormControl,
  FormLabel,
  Button,
  Text,
  Divider,
} from "@chakra-ui/react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";
import GoogleButton from "./GoogleButton";
import OtpModal from "./OtpModal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const afterAuth = (data) => {
    localStorage.setItem("userInfo", JSON.stringify({ ...data.user, token: data.token }));
    navigate("/chats");
  };

  const submitHandler = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({ title: "Please Fill all the Fields", status: "warning", position: "bottom" });
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post("/user/login", { email, password });
      toast({ title: "Login Successful", status: "success", position: "bottom" });
      afterAuth(data);
    } catch (error) {
      const err = error.response?.data || {};
      const status = error.response?.status;
      if (status === 403 && err.needsVerification) {
        setVerifyEmail(err.email || email);
        setShowOtp(true);
        toast({ title: "Email verification required", description: err.message, status: "info", position: "bottom" });
      } else {
        toast({ title: "Error", description: err.message || "An error occurred", status: "error", position: "bottom" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setGoogleLoading(true);
    try {
      const { data } = await axios.post("/user/google", { credential });
      toast({ title: "Google Login Successful", status: "success", position: "bottom" });
      afterAuth(data);
    } catch (error) {
      toast({
        title: "Google Login Failed",
        description: error?.response?.data?.message || "An error occurred",
        status: "error",
        position: "bottom",
      });
    } finally {
      setGoogleLoading(false);
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
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
        </FormControl>

        <FormControl id="password">
          <FormLabel textColor={"gray"}>Password :</FormLabel>
          <Input
            placeholder="Enter Password..."
            type="password"
            onChange={(e) => setPass(e.target.value)}
            value={password}
            onKeyDown={(e) => e.key === "Enter" && submitHandler()}
          />
        </FormControl>

        <Button colorScheme="green" w={"100%"} onClick={submitHandler} isLoading={loading}>
          Login
        </Button>

        <Text fontSize="sm" alignSelf="flex-end">
          <Link to="/forgot-password" style={{ color: "#0077b6" }}>
            Forgot password?
          </Link>
        </Text>

        <Divider />

        {googleLoading ? (
          <Button colorScheme="red" w={"100%"} isLoading>
            Continue with Google
          </Button>
        ) : (
          <GoogleButton onCredential={handleGoogleCredential} />
        )}

        <Button
          colorScheme="telegram"
          w={"100%"}
          onClick={() => {
            setPass("123456");
            setEmail("guest@gmail.com");
          }}
        >
          Guest Login
        </Button>
      </VStack>

      <OtpModal
        isOpen={showOtp}
        onClose={() => setShowOtp(false)}
        email={verifyEmail}
        purpose="verify"
        onVerified={(data) => {
          if (data.token) afterAuth(data);
        }}
      />
    </>
  );
};

export default Login;