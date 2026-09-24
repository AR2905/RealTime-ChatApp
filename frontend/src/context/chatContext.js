import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

const ChatContext = createContext(null);

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  const [notification, setNotification] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    let userInfo = null;
    try {
      userInfo = JSON.parse(localStorage.getItem("userInfo"));
    } catch (e) {
      userInfo = null;
    }
    setUser(userInfo);
    if (!userInfo) {
      navigate("/");
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      selectedChat,
      setSelectedChat,
      chats,
      setChats,
      notification,
      setNotification,
      onlineUsers,
      setOnlineUsers,
      socketConnected,
      setSocketConnected,
    }),
    [user, selectedChat, chats, notification, onlineUsers, socketConnected]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;