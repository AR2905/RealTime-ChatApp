import { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import { Box, IconButton, Image, Menu, MenuButton, MenuList, MenuItem, Popover, PopoverTrigger, PopoverContent, PopoverBody, Text, useToast } from "@chakra-ui/react";
import { EditIcon, DeleteIcon, SmallCloseIcon } from "@chakra-ui/icons";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
  formatTime,
  formatDay,
  REACTION_EMOJIS,
} from "../../config/chatLogic";
import { ChatState } from "../../context/chatContext";
import axios from "axios";

const ScrollableChat = ({ messages, socket, onMessageChange }) => {
  const { user } = ChatState();
  const toast = useToast();
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const otherUsersRead = (message) => {
    if (!message || !message.chat) return false;
    const others = (message.chat.users || []).filter((u) => u._id !== user?._id);
    if (!others.length) return true;
    const readUserIds = (message.readBy || []).map((r) => r?.toString?.() || r);
    return others.every((o) => readUserIds.includes(o._id.toString()));
  };

  const myLastMessage = messages.filter((m) => m.sender?._id === user?._id).slice(-1)[0];

  const request = async (method, url, body) => {
    const config = {
      method,
      url,
      headers: {
        "Content-type": "application/json",
        authorization: `Bearer ${user.token}`,
      },
    };
    if (body) config.data = body;
    return (await axios(config)).data;
  };

  const toggleReaction = async (message, emoji) => {
    try {
      const data = await request("post", `/message/reaction/${message._id}`, { emoji });
      if (socket) socket.emit("message reacted", { chatId: message.chat?._id, messageId: message._id, reactions: data.reactions });
      if (onMessageChange) onMessageChange(message._id, { reactions: data.reactions });
    } catch (err) {
      toast({ title: "Could not react", status: "error", position: "bottom" });
    }
  };

  const saveEdit = async (message) => {
    try {
      const updated = await request("put", `/message/${message._id}`, { content: editText });
      if (socket) socket.emit("message edited", { chatId: message.chat?._id, message: updated });
      if (onMessageChange) onMessageChange(message._id, updated);
    } catch (err) {
      toast({ title: "Edit failed", description: err?.response?.data?.message, status: "error", position: "bottom" });
    }
    setEditingId(null);
    setEditText("");
  };

  const removeMessage = async (message) => {
    try {
      await request("delete", `/message/${message._id}`);
      if (socket) socket.emit("message deleted", { chatId: message.chat?._id, messageId: message._id });
      if (onMessageChange) onMessageChange(message._id, null);
    } catch (err) {
      toast({ title: "Delete failed", description: err?.response?.data?.message, status: "error", position: "bottom" });
    }
  };

  const myReaction = (message, emoji) =>
    (message.reactions || []).some((r) => r.user?._id === user?._id && r.emoji === emoji);

  const showDayDivider = (m, i) => {
    if (i === 0) return true;
    const prev = new Date(messages[i - 1]?.createdAt);
    const curr = new Date(m.createdAt);
    return prev.toDateString() !== curr.toDateString();
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div key={m._id}>
            {showDayDivider(m, i) && (
              <Box textAlign="center" my={2}>
                <Text as="span" fontSize="xs" bg="#1b2a41" color="white" px={3} py={1} borderRadius="full">
                  {formatDay(m.createdAt)}
                </Text>
              </Box>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: m.sender?._id === user?._id ? "flex-end" : "flex-start",
              }}
            >
              {(isSameSender(messages, m, i, user._id) ||
                isLastMessage(messages, i, user._id)) && (
                <Tooltip label={m.sender?.name} placement="bottom-start" hasArrow>
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender?.name}
                    src={m.sender?.pic}
                  />
                </Tooltip>
              )}

              <Popover trigger="hover" placement="top" openDelay={600}>
                <PopoverTrigger>
                  <span
                    style={{
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: m.sender?._id === user?._id ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                    }}
                  >
                    <Box
                      bg={
                        m.sender?._id === user?._id ? "#BEE3F8" : "#B9F5D0"
                      }
                      ml={isSameSenderMargin(messages, m, i, user._id)}
                      mt={isSameUser(messages, m, i, user._id) ? 3 : 10}
                      borderRadius="20px"
                      padding="5px 12px"
                      color="black"
                      minW="40px"
                      position="relative"
                    >
                      <Text fontSize="sm" wordBreak="break-word">
                        {m.content}
                        {m.edited && (
                          <Text as="span" fontSize="10px" color="gray.500" ml={1}>
                            (edited)
                          </Text>
                        )}
                      </Text>

                      {m.attachment?.url && (
                        <Box mt={2} borderRadius="12px" overflow="hidden" maxW="260px">
                          {m.attachment.type === "image" ? (
                            <Image src={m.attachment.url} alt="attachment" borderRadius="12px" />
                          ) : (
                            <a href={m.attachment.url} target="_blank" rel="noreferrer" style={{ color: "blue", textDecoration: "underline" }}>
                              📎 {m.attachment.name || "File"}
                            </a>
                          )}
                        </Box>
                      )}

                      <Text
                        as="span"
                        fontSize="9px"
                        color="gray.600"
                        float="right"
                        mt={1}
                        ml={2}
                      >
                        {formatTime(m.createdAt)}
                      </Text>

                      {m.sender?._id === user?._id &&
                        m._id === myLastMessage?._id && (
                          <Text as="span" fontSize="9px" color={otherUsersRead(m) ? "#1565c0" : "gray.500"} ml={1}>
                            {otherUsersRead(m) ? "✓✓" : "✓"}
                          </Text>
                        )}
                    </Box>

                    {(m.reactions || []).length > 0 && (
                      <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                        {m.reactions.map((r) => (
                          <Box
                            key={r._id}
                            as="button"
                            bg={r.user?._id === user?._id ? "#bae6fd" : "#e2e8f0"}
                            px={1.5}
                            py={0.5}
                            borderRadius="full"
                            fontSize="xs"
                            onClick={() => toggleReaction(m, r.emoji)}
                          >
                            {r.emoji} {m.reactions.filter((x) => x.emoji === r.emoji).length}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </span>
                </PopoverTrigger>
                <PopoverContent w="auto">
                  <PopoverBody display="flex" gap={1} px={2} py={1.5}>
                    {REACTION_EMOJIS.map((emoji) => (
                      <IconButton
                        key={emoji}
                        aria-label={emoji}
                        icon={<span style={{ fontSize: 18 }}>{emoji}</span>}
                        size="sm"
                        variant={myReaction(m, emoji) ? "solid" : "ghost"}
                        colorScheme="gray"
                        onClick={() => toggleReaction(m, emoji)}
                      />
                    ))}
                    {m.sender?._id === user?._id && (
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="actions"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                        />
                        <MenuList minW="120px">
                          <MenuItem
                            icon={<EditIcon />}
                            onClick={() => {
                              setEditingId(m._id);
                              setEditText(m.content || "");
                            }}
                          >
                            Edit
                          </MenuItem>
                          <MenuItem
                            icon={<DeleteIcon />}
                            color="red.500"
                            onClick={() => removeMessage(m)}
                          >
                            Delete
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    )}
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </div>

            {editingId === m._id && (
              <Box ml={m.sender?._id === user?._id ? "auto" : 2} maxW="75%" mt={1} textAlign={m.sender?._id === user?._id ? "right" : "left"}>
                <Box display="inline-flex" gap={2} bg="#0c192c" p={2} borderRadius="lg">
                  <input
                    autoFocus
                    style={{
                      background: "transparent",
                      border: "1px solid #444",
                      color: "white",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      width: 240,
                      fontSize: 14,
                    }}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(m);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditText("");
                      }
                    }}
                  />
                  <IconButton size="sm" aria-label="Save" colorScheme="green" icon={<span>✓</span>} onClick={() => saveEdit(m)} />
                  <IconButton size="sm" aria-label="Cancel" icon={<SmallCloseIcon />} onClick={() => { setEditingId(null); setEditText(""); }} />
                </Box>
              </Box>
            )}
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;