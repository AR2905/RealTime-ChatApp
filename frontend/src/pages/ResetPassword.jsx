import React, { useState } from "react";
import {
  Container,
  Box,
  Text,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  PinInput,
  PinInputField,
} from "@chakra-ui/react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("otp");
  const toast = useToast();
  const navigate = useNavigate();

  const verifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast({ title: "Please enter the 6-digit code", status: "warning", position: "bottom" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/user/verify-otp", { email, otp, purpose: "reset" });
      toast({ title: "Code verified", description: data.message, status: "success", position: "bottom" });
      setStep("password");
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error?.response?.data?.message,
        status: "error",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await axios.post("/user/resend-otp", { email, purpose: "reset" });
      toast({ title: "A new code was sent", status: "success", position: "bottom" });
    } catch (error) {
      toast({ title: "Could not resend", status: "error", position: "bottom" });
    }
  };

  const resetPassword = async () => {
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast({
        title: "Weak password",
        description: "Use at least 8 characters with one letter and one number.",
        status: "warning",
        position: "bottom",
      });
      return;
    }
    if (newPassword !== confirm) {
      toast({ title: "Passwords do not match", status: "warning", position: "bottom" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/user/reset-password", { email, newPassword });
      toast({ title: "Password updated", description: data.message, status: "success", position: "bottom" });
      navigate("/");
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
        Set New Password
      </Box>
      <Box w="100%" borderRadius="lg" borderWidth="1px" p={6} backgroundColor="#151515">
        <VStack spacing="10px">
          <Text fontSize="sm" color="gray.400">
            Resetting password for <b style={{ color: "white" }}>{email}</b>
          </Text>

          {step === "otp" ? (
            <>
              <PinInput size="lg" onChange={setOtp} value={otp}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <PinInputField key={i} />
                ))}
              </PinInput>
              <Button colorScheme="green" w="100%" isLoading={loading} onClick={verifyOtp}>
                Verify Code
              </Button>
              <Button variant="ghost" size="sm" w="100%" onClick={resend}>
                Resend code
              </Button>
            </>
          ) : (
            <>
              <FormControl id="newpassword">
                <FormLabel textColor="gray">New Password :</FormLabel>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </FormControl>
              <FormControl id="confirm">
                <FormLabel textColor="gray">Confirm Password :</FormLabel>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </FormControl>
              <Button colorScheme="green" w="100%" isLoading={loading} onClick={resetPassword}>
                Update Password
              </Button>
            </>
          )}

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

export default ResetPassword;