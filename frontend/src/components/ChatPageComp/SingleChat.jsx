import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { ArrowBackIcon, SearchIcon, AttachmentIcon, CloseIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull, timeAgo } from "../../config/chatLogic";
import ProfileModal from "./ProfileModal";
import UpdateGroupChatModal from "./UpdateGroupChatModal";
import axios from "axios";
import ScrollableChat from "./ScrollableChat";
import animationData from "../../Animations/typing.json";
import Lottie from "react-lottie";
import { getSocket } from "../../config/socket";
import { ChatState } from "../../context/chatContext";
import { uploadToCloudinary } from "../../config/upload";

const PAGE_SIZE = 30;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [istyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [attachLoading, setAttachLoading] = useState(false);
  const toast = useToast();

  const {
    selectedChat,
    setSelectedChat,
    user,
    setNotification,
    socketConnected,
    setSocketConnected,
    onlineUsers,
  } = ChatState();

  const socket = getSocket(user);
  const messagesRef = useRef(messages);
  const selectedChatRef = useRef(selectedChat);

  messagesRef.current = messages;
  selectedChatRef.current = selectedChat;

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  };

  const getConfig = () => ({
    headers: {
      authorization: `Bearer ${user.token}`,
    },
  });

  const markAsRead = async (chatId) => {
    if (!chatId) return;
    try {
      await axios.put(`/message/${chatId}/read`, {}, getConfig());
      socket.emit("msg read", { chatId, userId: user._id });
      setMessages((prev) =>
        prev.map((m) =>
          m.sender?._id !== user._id && !(m.readBy || []).includes(user._id)
            ? { ...m, readBy: [...(m.readBy || []), user._id] }
            : m
        )
      );
    } catch (err) {
      // silent
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      setSearchResults(null);
      const { data } = await axios.get(`/message/${selectedChat._id}?limit=${PAGE_SIZE}&skip=0`, getConfig());
      setMessages(data.messages || []);
      setHasMore(data.hasMore || false);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
      markAsRead(selectedChat._id);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load the msgs", status: "error", position: "bottom" });
      setLoading(false);
    }
  };

  const loadOlder = async () => {
    if (!selectedChat || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await axios.get(
        `/message/${selectedChat._id}?limit=${PAGE_SIZE}&skip=${messagesRef.current.length}`,
        getConfig()
      );
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore || false);
    } catch (e) {
      toast({ title: "Could not load older messages", status: "error", position: "bottom" });
    } finally {
      setLoadingMore(false);
    }
  };

  const searchMessages = async (q) => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const { data } = await axios.get(`/message/${selectedChatRef.current._id}/search?q=${encodeURIComponent(q.trim())}`, getConfig());
      setSearchResults(data.messages || []);
    } catch (e) {
      setSearchResults([]);
    }
  };

  // Socket lifecycle
  useEffect(() => {
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    return () => {
      socket.off("connected");
    };
    // eslint-disable-next-line
  }, []);

  // Chat change
  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, [selectedChat]);

  // Mount + chat-scoped listeners
  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    const onMsgReceived = (newMessageRecieved) => {
      const cur = selectedChatRef.current;
      if (!cur || cur._id !== newMessageRecieved.chat._id) {
        setNotification((prev) => (prev.some((n) => n._id === newMessageRecieved._id) ? prev : [newMessageRecieved, ...prev]));
        setFetchAgain((f) => !f);
      } else {
        setMessages((prev) => (prev.some((m) => m._id === newMessageRecieved._id) ? prev : [...prev, newMessageRecieved]));
        markAsRead(newMessageRecieved.chat._id);
      }
    };

    const onEdited = (message) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    const onDeleted = (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setFetchAgain((f) => !f);
    };

    const onReacted = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
    };

    const onRead = ({ chatId, userId }) => {
      // userId read this chat → mark MY messages as read by them (✓✓ for sender)
      if (chatId === selectedChatRef.current?._id && userId !== user._id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender?._id === user._id && !(m.readBy || []).includes(userId)
              ? { ...m, readBy: [...(m.readBy || []), userId] }
              : m
          )
        );
      }
    };

    socket.on("msg recieved", onMsgReceived);
    socket.on("message edited", onEdited);
    socket.on("message deleted", onDeleted);
    socket.on("message reacted", onReacted);
    socket.on("messages read", onRead);

    return () => {
      socket.off("msg recieved", onMsgReceived);
      socket.off("message edited", onEdited);
      socket.off("message deleted", onDeleted);
      socket.off("message reacted", onReacted);
      socket.off("messages read", onRead);
    };
    // eslint-disable-next-line
  }, []);

  const sendMessage = async (content, attachment) => {
    if ((!content || !content.trim()) && !attachment?.url) return;

    try {
      setNewMessage("");
      socket.emit("stop typing", selectedChat._id);
      const config = {
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        "/message",
        { content: content || "", chatId: selectedChat._id, attachment },
        config
      );
      socket.emit("new msg", data);
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      toast({ title: "Msg not sent", status: "error", position: "bottom" });
    }
  };

  const sendMsgOnClick = () => sendMessage(newMessage);
  const onKeySend = (e) => {
    if (e.key === "Enter" && newMessage) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const handleAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachLoading(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      await sendMessage("", { url: uploaded.url, type: "image", name: file.name });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, status: "error", position: "bottom" });
    } finally {
      setAttachLoading(false);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const isDM = !selectedChat?.isGroupChat;
  const otherUser = isDM ? getSenderFull(user, selectedChat?.users) : null;
  const otherOnline =
    isDM &&
    otherUser?._id &&
    (onlineUsers[otherUser._id] !== undefined
      ? onlineUsers[otherUser._id]
      : otherUser.online);

  const headerSub = isDM
    ? otherUser?._id
      ? `${otherOnline ? "🟢 Online" : `Last seen ${timeAgo(otherUser.lastSeen)}`}`
      : ""
    : `${selectedChat?.users?.length || 0} members`;

  const displayedMessages = searchResults || messages;

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            className="ChatBoxUserName"
            fontSize={{ base: "20px", md: "24px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <IconButton
              className="SingleChatBtn"
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            <Box minW={0}>
              <Box display="flex" alignItems="center" gap={2}>
                {isDM ? getSender(user, selectedChat.users) : selectedChat.chatName.toUpperCase()}
                {isDM && (
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={otherOnline ? "#25D366" : "gray.500"}
                    display="inline-block"
                  />
                )}
              </Box>
              <Text fontSize="xs" color="gray.400" fontWeight="normal">
                {headerSub}
              </Text>
            </Box>

            <Box display="flex" gap={2} alignItems="center">
              <IconButton
                icon={showSearch ? <CloseIcon /> : <SearchIcon />}
                aria-label="Search messages"
                onClick={() => {
                  setShowSearch((s) => !s);
                  setSearchResults(null);
                  setSearchTerm("");
                }}
              />
              {isDM ? (
                <ProfileModal user={otherUser} />
              ) : (
                <UpdateGroupChatModal
                  fetchMessages={fetchMessages}
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                />
              )}
            </Box>
          </Text>

          {showSearch && (
            <Input
              placeholder="Search in this chat..."
              mb={2}
              value={searchTerm}
              autoFocus
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchMessages(e.target.value);
              }}
            />
          )}

          <Box
            className="forSingleChatsize"
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#000B18"
            color={"black"}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" color="cyan" />
            ) : (
              <Box
                className="messages"
                display="flex"
                flexDirection="column"
                overflowY="scroll"
                sx={{
                  "&::-webkit-scrollbar": { display: "none" },
                  scrollbarWidth: "none",
                }}
              >
                {hasMore && !searchResults && (
                  <Button size="xs" mb={2} alignSelf="center" onClick={loadOlder} isLoading={loadingMore}>
                    Load older messages
                  </Button>
                )}
                <ScrollableChat
                  messages={displayedMessages}
                  socket={socket}
                  onMessageChange={(id, patch) => {
                    if (patch === null) {
                      setMessages((prev) => prev.filter((m) => m._id !== id));
                      setSearchResults((prev) => (prev ? prev.filter((m) => m._id !== id) : prev));
                    } else {
                      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, ...patch } : m)));
                      setSearchResults((prev) => (prev ? prev.map((m) => (m._id === id ? { ...m, ...patch } : m)) : prev));
                    }
                  }}
                />
              </Box>
            )}

            <FormControl onKeyDown={onKeySend} isRequired mt={3}>
              {istyping ? (
                <div style={{ marginBottom: 15, marginLeft: 0, display: "inline-block" }}>
                  <Lottie options={defaultOptions} width={70} />
                </div>
              ) : (
                <></>
              )}
              <InputGroup>
                <Input
                  className="ChatBoxInput"
                  variant="filled"
                  bg="#0c192c"
                  placeholder={attachLoading ? "Uploading image..." : "Enter a message.."}
                  _hover={{ backgroundColor: "black" }}
                  value={newMessage}
                  onChange={typingHandler}
                  color="white"
                  isDisabled={attachLoading}
                />
                <InputRightElement width="4.5rem" pr={1}>
                  <IconButton
                    aria-label="attach"
                    icon={attachLoading ? <Spinner size="sm" /> : <AttachmentIcon />}
                    size="sm"
                    bg="transparent"
                    color="cyan.300"
                    _hover={{ bg: "black" }}
                    onClick={() => document.getElementById("attach-input")?.click()}
                  />
                  <input type="file" accept="image/*" id="attach-input" style={{ display: "none" }} onChange={handleAttachment} />
                  <Button
                    className="sendingBtn"
                    size="sm"
                    p="0 10px"
                    color="#00717f"
                    backgroundColor="#212121"
                    borderTopLeftRadius={0}
                    borderBottomLeftRadius={0}
                    onClick={sendMsgOnClick}
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;