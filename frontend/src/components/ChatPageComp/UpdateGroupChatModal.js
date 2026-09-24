import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";
import { ChatState } from "../../context/chatContext";
import UserBadgeItem from "./UserBadgeItem";
import axios from "axios";
import UserListItem from "./UserListItem";

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain, fetchMessages }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameloading, setRenameLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [groupPic, setGroupPic] = useState();
  const toast = useToast();

  const { user, selectedChat, setSelectedChat, setChats } = ChatState();
  const isAdmin = selectedChat?.GroupAdmin?._id === user?._id;

  const getConfig = () => ({
    headers: {
      "Content-type": "application/json",
      authorization: `Bearer ${user.token}`,
    },
  });

  const handleRename = async () => {
    if (!groupChatName) return;
    setRenameLoading(true);
    try {
      const { data } = await axios.put("/chat/rename", { chatId: selectedChat._id, chatName: groupChatName }, getConfig());
      setSelectedChat(data);
      setChats((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      setFetchAgain(!fetchAgain);
    } catch (error) {
      toast({ title: "Error Occured!", description: error.response.data.message, status: "error", position: "bottom" });
    } finally {
      setRenameLoading(false);
      setGroupChatName("");
    }
  };

  const handleGroupPic = async () => {
    if (!groupPic) return;
    setActionLoading("pic");
    try {
      const { data } = await axios.put("/chat/grouppic", { chatId: selectedChat._id, groupPic }, getConfig());
      setSelectedChat(data);
      setChats((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      setFetchAgain(!fetchAgain);
      toast({ title: "Group picture updated", status: "success", position: "bottom" });
      setGroupPic("");
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message, status: "error", position: "bottom" });
    } finally {
      setActionLoading("");
    }
  };

  const handleRemove = async (user1) => {
    if (!isAdmin && user1._id !== user._id) {
      toast({ title: "Only admins can remove someone!", status: "error", position: "bottom" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.put("/chat/removefromgroup", { chatId: selectedChat._id, userId: user1._id }, getConfig());
      user1._id === user._id ? setSelectedChat(undefined) : setSelectedChat(data);
      setChats((prev) => prev.map((c) => (c._id === selectedChat._id ? data : c)));
      setFetchAgain(!fetchAgain);
      fetchMessages();
    } catch (error) {
      toast({ title: "Error Occured!", description: error.response.data.message, status: "error", position: "bottom" });
    } finally {
      setLoading(false);
      setGroupChatName("");
    }
  };

  const handleAddUser = async (user1) => {
    if (!isAdmin) {
      toast({ title: "Only admins can add someone!", status: "error", position: "bottom" });
      return;
    }
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      toast({ title: "User Already in group!", status: "warning", position: "bottom" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.put("/chat/addtogroup", { chatId: selectedChat._id, userId: user1._id }, getConfig());
      setSelectedChat(data);
      setChats((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      setFetchAgain(!fetchAgain);
    } catch (error) {
      toast({ title: "Error Occured!", description: error.response.data.message, status: "error", position: "bottom" });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (newAdmin) => {
    setActionLoading("transfer");
    try {
      const { data } = await axios.put("/chat/transfer", { chatId: selectedChat._id, userId: newAdmin._id }, getConfig());
      setSelectedChat(data);
      setChats((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      setFetchAgain(!fetchAgain);
      toast({ title: `Ownership transferred to ${newAdmin.name}`, status: "success", position: "bottom" });
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message, status: "error", position: "bottom" });
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteGroup = async () => {
    setActionLoading("delete");
    try {
      await axios.delete(`/chat/group/${selectedChat._id}`, getConfig());
      setChats((prev) => prev.filter((c) => c._id !== selectedChat._id));
      setSelectedChat(undefined);
      setFetchAgain(!fetchAgain);
      onClose();
      toast({ title: "Group deleted", status: "success", position: "bottom" });
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message, status: "error", position: "bottom" });
    } finally {
      setActionLoading("");
    }
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/users?search=${search}`, getConfig());
      setSearchResult(data);
    } catch (error) {
      toast({ title: "Error Occured!", description: "Failed to Load the Search Results", status: "error", position: "bottom-left" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <IconButton onClick={onOpen} icon={<ViewIcon />} display={{ base: "flex" }} />
      <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent className="UpdateGrpModalBox">
          <ModalHeader
            className="UpdateGrpModalHeader"
            fontSize="35px"
            fontFamily="Work sans"
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
          >
            <Box>
              {selectedChat.chatName}{" "}
              {isAdmin && <span style={{ fontSize: "12px", color: "#0077b6" }}>(Admin)</span>}
            </Box>
            {selectedChat.groupPic && (
              <img
                src={selectedChat.groupPic}
                alt="group"
                style={{ width: 80, height: 80, borderRadius: "50%", marginTop: 8, objectFit: "cover" }}
              />
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" flexDir="column" alignItems="center">
            {isAdmin && (
              <FormControl display="flex" mb={2}>
                <Input placeholder="Group Picture URL" mb={3} value={groupPic} onChange={(e) => setGroupPic(e.target.value)} />
                <Button ml={1} isLoading={actionLoading === "pic"} onClick={handleGroupPic}>
                  Set
                </Button>
              </FormControl>
            )}

            <Box w="100%" display="flex" flexWrap="wrap" pb={3}>
              {selectedChat.users.map((u) => (
                <UserBadgeItem key={u._id} user={u} admin={selectedChat.GroupAdmin} handleFunction={() => handleRemove(u)} />
              ))}
            </Box>

            {isAdmin && (
              <>
                <FormControl display="flex">
                  <Input className="UpdateGrpModalInput1" placeholder="Chat Name" mb={3} value={groupChatName} onChange={(e) => setGroupChatName(e.target.value)} />
                  <Button className="UpdateGrpModalUpdateBtn" variant="solid" colorScheme="teal" ml={1} isLoading={renameloading} onClick={handleRename}>
                    Update
                  </Button>
                </FormControl>
                <FormControl>
                  <Input className="UpdateGrpModalInput2" placeholder="Add User to group" mb={1} onChange={(e) => handleSearch(e.target.value)} />
                </FormControl>
              </>
            )}

            {loading ? (
              <Spinner size="lg" />
            ) : (
              searchResult?.map((u) => (
                <UserListItem key={u._id} user={u} handleFunction={() => handleAddUser(u)} />
              ))
            )}

            {isAdmin && (
              <Box w="100%" mt={3}>
                <Text fontWeight="bold" mb={1}>
                  Transfer admin to:
                </Text>
                {selectedChat.users
                  .filter((u) => u._id !== user._id)
                  .map((u) => (
                    <Button key={u._id} size="sm" variant="outline" mr={1} mb={1} onClick={() => handleTransfer(u)} isLoading={actionLoading === "transfer"}>
                      {u.name}
                    </Button>
                  ))}
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <Button className="UpdateGrpModalLeaveGrpBtn" colorScheme="red" onClick={() => handleRemove(user)}>
              Leave Group
            </Button>
            {isAdmin && (
              <Button ml={2} colorScheme="red" variant="outline" onClick={handleDeleteGroup} isLoading={actionLoading === "delete"}>
                Delete Group
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default UpdateGroupChatModal;