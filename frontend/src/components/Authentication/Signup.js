import React, { useState } from "react";
import { Input, VStack, FormControl, FormLabel, Button, Text } from "@chakra-ui/react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "../../config/upload";
import OtpModal from "./OtpModal";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [confirmpassword, setConfirmpass] = useState("");
  const [pic, setPic] = useState();
  const [picLoading, setPicLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const passwordOk = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmpassword) {
      toast({ title: "Please Fill all the Fields", status: "warning", position: "bottom" });
      return;
    }
    if (password !== confirmpassword) {
      toast({ title: "Passwords Do Not Match", status: "warning", position: "bottom" });
      return;
    }
    if (!passwordOk(password)) {
      toast({
        title: "Weak password",
        description: "Use at least 8 characters with one letter and one number.",
        status: "warning",
        position: "bottom",
      });
      return;
    }

    setSignupLoading(true);
    try {
      const { data } = await axios.post("/user/signup", { name, email, password, pic });
      if (data.needsVerification) {
        setVerifyEmail(data.email || email);
        setShowOtp(true);
        toast({
          title: "Check your inbox",
          description: data.message,
          status: "info",
          position: "bottom",
        });
      } else {
        localStorage.setItem("userInfo", JSON.stringify({ ...data.user, token: data.token }));
        navigate("/chats");
      }
    } catch (error) {
      const err = error?.response?.data || {};
      if (error?.response?.status === 409 && err.needsVerification) {
        setVerifyEmail(email);
        setShowOtp(true);
        toast({
          title: "Verify your existing account",
          description: err.message,
          status: "info",
          position: "bottom",
        });
        return;
      }
      toast({
        title: "Error Occurred!",
        description: err.message || "Registration failed",
        status: "error",
        position: "bottom",
      });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicLoading(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      setPic(uploaded.url);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, status: "error", position: "bottom" });
    } finally {
      setPicLoading(false);
    }
  };

  return (
    <>
      <VStack spacing={"10px"}>
        <FormControl id="name">
          <FormLabel textColor={"gray"}>Name :</FormLabel>
          <Input placeholder="Enter your name..." type="text" onChange={(e) => setName(e.target.value)} />
        </FormControl>

        <FormControl id="email">
          <FormLabel textColor={"gray"}>Email :</FormLabel>
          <Input placeholder="mail@example.com" type="text" onChange={(e) => setEmail(e.target.value)} />
        </FormControl>

        <FormControl id="password">
          <FormLabel textColor={"gray"}>Password :</FormLabel>
          <Input placeholder="Enter Password..." type="password" onChange={(e) => setPass(e.target.value)} />
        </FormControl>

        <FormControl id="confirmpassword">
          <FormLabel textColor={"gray"}>Re-Enter Password :</FormLabel>
          <Input
            placeholder="re-enter password..."
            type="password"
            onChange={(e) => setConfirmpass(e.target.value)}
          />
        </FormControl>

        <FormControl id="pic">
          <FormLabel
            textColor={"gray"}
            className="ChooseButton"
            display={"flex"}
            border={"1px solid cyan"}
            p={2}
            borderRadius={"lg"}
            _hover={{ bg: "#000", color: "white", borderColor: "black" }}
            width={"max-content"}
          >
            {picLoading ? "Uploading..." : "Choose Your Profile Picture"}
          </FormLabel>
          <Input type="file" accept="image/*" display={"none"} onChange={handleFileChange} />
        </FormControl>

        <Text fontSize="xs" color="gray.400" w="100%" textAlign="center">
          Password must be 8+ characters and contain at least one letter and number.
        </Text>

        <Button
          colorScheme="telegram"
          width={"100%"}
          marginTop={2}
          onClick={handleSubmit}
          isLoading={signupLoading || picLoading}
        >
          SignUp
        </Button>
      </VStack>

      <OtpModal
        isOpen={showOtp}
        onClose={() => setShowOtp(false)}
        email={verifyEmail}
        purpose="verify"
        onVerified={(data) => {
          if (data.token) {
            localStorage.setItem("userInfo", JSON.stringify({ ...data.user, token: data.token }));
            navigate("/chats");
          }
        }}
      />
    </>
  );
};

export default Signup;