import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  PinInput,
  PinInputField,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { saveUser } from "../../config/api";

const OtpModal = ({ isOpen, onClose, email, purpose = "verify", onVerified }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const toast = useToast();

  const verifyHandler = async () => {
    if (!otp || otp.length < 6) {
      toast({ title: "Please enter the 6-digit code", status: "warning", position: "bottom" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/user/verify-otp", { email, otp, purpose });
      if (purpose === "verify" && data.token) {
        saveUser({ ...data.user, token: data.token });
      }
      toast({ title: "Success", description: data.message, status: "success", position: "bottom" });
      onClose();
      setOtp("");
      if (onVerified) onVerified(data);
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error?.response?.data?.message || "Invalid or expired code.",
        status: "error",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const resendHandler = async () => {
    setResendLoading(true);
    try {
      await axios.post("/user/resend-otp", { email, purpose });
      toast({ title: "A new code was sent to your email", status: "success", position: "bottom" });
    } catch (error) {
      toast({
        title: "Could not resend code",
        description: error?.response?.data?.message,
        status: "error",
        position: "bottom",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent m={2} textAlign="center">
        <ModalHeader>Verify your email</ModalHeader>
        <ModalCloseButton onClick={onClose} />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Text fontSize="sm" color="gray.500">
              We sent a 6-digit code to{" "}
              <b style={{ color: "black" }}>{email}</b>. Enter it below.
            </Text>
            <PinInput size="lg" onChange={(val) => setOtp(val)} value={otp}>
              {Array.from({ length: 6 }).map((_, i) => (
                <PinInputField key={i} />
              ))}
            </PinInput>
            <Button colorScheme="green" w="100%" isLoading={loading} onClick={verifyHandler}>
              Verify Code
            </Button>
            <Button
              variant="ghost"
              size="sm"
              w="100%"
              isLoading={resendLoading}
              onClick={resendHandler}
            >
              Resend code
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default OtpModal;