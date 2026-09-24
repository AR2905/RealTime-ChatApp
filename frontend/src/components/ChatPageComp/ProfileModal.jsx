import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  IconButton,
  Text,
  Image,
  Input,
  FormControl,
  VStack,
  Box,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChatState } from "../../context/chatContext";
import { uploadToCloudinary } from "../../config/upload";
import { timeAgo } from "../../config/chatLogic";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user: me, setUser, setChats, selectedChat, setSelectedChat, onlineUsers } = ChatState();
  const isMe = me?._id === user?._id;
  const toast = useToast();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [picLoading, setPicLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const cancelRef = useRef();

  const isOnline =
    onlineUsers[user?._id] !== undefined ? onlineUsers[user?._id] : user?.online;

  const getConfig = () => ({
    headers: {
      "Content-type": "application/json",
      authorization: `Bearer ${me.token}`,
    },
  });

  const saveProfile = async () => {
    if (name.trim().length < 3) {
      toast({ title: "Name must be at least 3 characters", status: "warning", position: "bottom" });
      return;
    }
    setLoadingAction("save");
    try {
      const { data } = await axios.put("/user/profile", { name: name.trim() }, getConfig());
      const newer = { ...me, ...data.user };
      setUser(newer);
      localStorage.setItem("userInfo", JSON.stringify(newer));
      toast({ title: "Profile updated", status: "success", position: "bottom" });
      setEditMode(false);
    } catch (err) {
      toast({ title: "Update failed", description: err?.response?.data?.message, status: "error", position: "bottom" });
    } finally {
      setLoadingAction("");
    }
  };

  const changePic = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicLoading(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      const { data } = await axios.put("/user/profile", { pic: uploaded.url }, getConfig());
      const newer = { ...me, ...data.user };
      setUser(newer);
      localStorage.setItem("userInfo", JSON.stringify(newer));
      toast({ title: "Profile picture updated", status: "success", position: "bottom" });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, status: "error", position: "bottom" });
    } finally {
      setPicLoading(false);
    }
  };

  const changePassword = async () => {
    setLoadingAction("pwd");
    try {
      const { data } = await axios.put(
        "/user/password",
        { currentPassword: currPass, newPassword: newPass },
        getConfig()
      );
      toast({ title: "Success", description: data.message, status: "success", position: "bottom" });
      setCurrPass("");
      setNewPass("");
    } catch (err) {
      toast({ title: "Could not change password", description: err?.response?.data?.message, status: "error", position: "bottom" });
    } finally {
      setLoadingAction("");
    }
  };

  const handleBlock = async () => {
    setLoadingAction("block");
    try {
      await axios.put(`/user/block/${user._id}`, {}, getConfig());
      toast({ title: "User blocked", status: "success", position: "bottom" });
      if (selectedChat && !selectedChat.isGroupChat) setSelectedChat("");
      setChats((prev) => prev.filter((c) => c.isGroupChat || !c.users.some((u) => u._id === user._id)));
      onClose();
    } catch (err) {
      toast({ title: "Could not block", status: "error", position: "bottom" });
    } finally {
      setLoadingAction("");
    }
  };

  const handleUnblock = async () => {
    setLoadingAction("unblock");
    try {
      await axios.put(`/user/unblock/${user._id}`, {}, getConfig());
      toast({ title: "User unblocked", status: "success", position: "bottom" });
    } catch (err) {
      toast({ title: "Could not unblock", status: "error", position: "bottom" });
    } finally {
      setLoadingAction("");
    }
  };

  const handleDeleteAccount = async () => {
    setLoadingAction("delete");
    try {
      await axios.delete("/user/account", getConfig());
      localStorage.removeItem("userInfo");
      setUser(null);
      setChats([]);
      navigate("/");
    } catch (err) {
      toast({ title: "Could not delete account", description: err?.response?.data?.message, status: "error", position: "bottom" });
    } finally {
      setLoadingAction("");
      setDeleteAlertOpen(false);
    }
  };

  const isBlocked = (me?.blocked || []).includes(user?._id);

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton className="ChatEyeButton" display={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />
      )}
      <Modal size="lg" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent h={editMode ? "auto" : "460px"} m={2} className="ProfileModalBox" overflowY="auto">
          <ModalHeader
            className="ProfileModalHeader"
            fontSize="40px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            {editMode ? "Edit Profile" : user.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" flexDir="column" alignItems="center" justifyContent="flex-start" gap={3}>
            <Image
              borderRadius="full"
              boxSize="130px"
              src={user.pic}
              alt={user.name}
              border={isOnline ? "4px solid #25D366" : "4px solid transparent"}
            />
            {!isMe && (
              <Text fontSize="sm" color={isOnline ? "green.500" : "gray.500"} fontWeight="bold">
                {isOnline ? "● Online" : `Last seen ${timeAgo(user.lastSeen)}`}
              </Text>
            )}

            {isMe && editMode ? (
              <VStack w="100%" spacing={3}>
                <FormControl>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                </FormControl>
                <Button w="100%" colorScheme="blue" size="sm" onClick={saveProfile} isLoading={loadingAction === "save"}>
                  Save Name
                </Button>
                <label
                  style={{
                    border: "1px solid cyan",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    width: "100%",
                    textAlign: "center",
                  }}
                  className="ChooseButton"
                >
                  {picLoading ? "Uploading..." : "Change Profile Picture"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={changePic} />
                </label>
              </VStack>
            ) : null}

            <Text className="ProfileModalEmail" fontSize={{ base: "20px", md: "22px" }} fontFamily="Work sans">
              Email: {user.email}
            </Text>

            {isMe && editMode && (
              <VStack w="100%">
                <Text fontWeight="bold" textAlign="center" mb={2}>
                  Change Password
                </Text>
                <Input type="password" placeholder="Current password" value={currPass} onChange={(e) => setCurrPass(e.target.value)} mb={2} />
                <Input type="password" placeholder="New password (8+ chars, letter + number)" value={newPass} onChange={(e) => setNewPass(e.target.value)} mb={2} />
                <Button w="100%" colorScheme="orange" size="sm" onClick={changePassword} isLoading={loadingAction === "pwd"}>
                  Update Password
                </Button>
              </VStack>
            )}

            {!isMe && isBlocked && (
              <Button colorScheme="gray" w="100%" color="black" onClick={handleUnblock} isLoading={loadingAction === "unblock"}>
                Unblock User
              </Button>
            )}
            {!isMe && !isBlocked && (
              <Button colorScheme="red" variant="outline" w="100%" onClick={handleBlock} isLoading={loadingAction === "block"}>
                Block User
              </Button>
            )}
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            {isMe && (
              <Button
                colorScheme="red"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteAlertOpen(true)}
              >
                Delete Account
              </Button>
            )}
            <Box display="flex">
              {isMe && !editMode && (
                <Button colorScheme="blue" size="sm" mr={2} onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              )}
              {isMe && editMode && (
                <Button colorScheme="gray" size="sm" mr={2} onClick={() => setEditMode(false)}>
                  Done
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={deleteAlertOpen} leastDestructiveRef={cancelRef} onClose={() => setDeleteAlertOpen(false)}>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete account?
          </AlertDialogHeader>
          <AlertDialogBody>
            This will permanently delete your profile, chats and messages. This action cannot be undone.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setDeleteAlertOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="red" ml={3} onClick={handleDeleteAccount} isLoading={loadingAction === "delete"}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileModal;