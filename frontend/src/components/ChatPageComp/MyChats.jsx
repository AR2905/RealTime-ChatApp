import { Box, Stack, Text, Badge } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useEffect, useState } from "react";
import ChatLoading from "./ChatLoading";
import { ChatState } from "../../context/chatContext";
import { AddIcon } from "@chakra-ui/icons";
import { Button } from "@chakra-ui/react";
import { getSender } from "../../config/chatLogic";
import GroupChatModal from "./GroupChatModal";
import { getSocket } from "../../config/socket";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, user, chats, setChats, onlineUsers, setOnlineUsers, setSocketConnected } = ChatState();
  const toast = useToast();
  const [unread, setUnread] = useState({});

  const fetchChats = async () => {
    try {
      const config = {
        headers: { authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get("/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error fetch chat!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const fetchUnread = async () => {
    try {
      const config = {
        headers: { authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get("/api/users/unread", config);
      const map = {};
      (data.counts || []).forEach((c) => (map[c.chatId] = c.count));
      setUnread(map);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    fetchUnread();
    // eslint-disable-next-line
  }, [fetchAgain]);

  // Socket: presence + connected
  useEffect(() => {
    if (!user) return;
    const socket = getSocket(user);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("user presence", ({ userId, online, lastSeen }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
    });
    fetchUnread();
    return () => {
      socket.off("connected");
      socket.off("user presence");
    };
    // eslint-disable-next-line
  }, [user]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      bg={"#111"}
      color={"white"}
      p={3}
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
      mt={0}
    >
      <Box
        className="ChatBoxHeading"
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        My Chats
        <GroupChatModal>
          <Button
            className="NewGrpBtn"
            display="flex"
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
            rightIcon={<AddIcon />}
          >
            Create Group
          </Button>
        </GroupChatModal>
      </Box>
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#11111"
        w="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => {
              const isDM = !chat.isGroupChat;
              const other = isDM ? chat.users?.find((u) => u._id !== loggedUser?._id) : null;
              const isOnline =
                onlineUsers[other?._id] !== undefined
                  ? onlineUsers[other?._id]
                  : other?.online || false;
              const unreadCount = selectedChat?._id === chat._id ? 0 : unread[chat._id] || 0;
              const senderName = chat.latestMessage?.sender?.name;

              return (
                <Box
                  onClick={() => {
                    setSelectedChat(chat);
                    setUnread((prev) => ({ ...prev, [chat._id]: 0 }));
                  }}
                  cursor="pointer"
                  bg={selectedChat === chat ? "#000" : "#3c3c3c"}
                  color={selectedChat === chat ? "#fff" : "#ccc"}
                  border={"2px solid transparent"}
                  borderColor={selectedChat === chat ? "white" : "transparent"}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  key={chat._id}
                  position="relative"
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    {isDM && (
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        bg={isOnline ? "#25D366" : "#6b7280"}
                      />
                    )}
                    <Text fontWeight={unreadCount > 0 ? "bold" : "normal"} flex="1">
                      {isDM ? getSender(loggedUser, chat.users) : chat.chatName}
                    </Text>
                    {unreadCount > 0 && (
                      <Badge borderRadius="full" px={2} colorScheme="red" fontSize="xs" mt={1}>
                        {unreadCount}
                      </Badge>
                    )}
                  </Box>
                  {chat.latestMessage && (
                    <Text fontSize="xs">
                      <b>
                        {senderName && senderName !== getSender(loggedUser, chat.users)
                          ? senderName
                          : ""}
                        {senderName === getSender(loggedUser, chat.users) ? "You" : ""} :{" "}
                      </b>
                      {chat.latestMessage.content?.length > 50
                        ? chat.latestMessage.content.substring(0, 51) + "..."
                        : chat.latestMessage.content || "📎 Attachment"}
                    </Text>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;