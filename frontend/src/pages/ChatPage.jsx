import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../components/ChatPageComp/SideBar";
import MyChats from "../components/ChatPageComp/MyChats";
import ChatBox from "../components/ChatPageComp/ChatBox";
import { ChatState } from "../context/chatContext";

const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = ChatState()

  const [fetchAgain, setFetchAgain] = useState(false);

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      
      if (!userInfo) {
        navigate("/"); // Redirect to the login page
      }
    } catch (error) {
      navigate("/");

    }
    // If user is not logged in, redirect to the login page

  }, [navigate]);

  return (
    <div style={{ width: "100%" }}>
      {user && <SideBar />}
      <Box display="flex" flexDirection="row" justifyContent="space-between" w="100%" h="91.5vh" p="10px">
        {user && <MyChats fetchAgain={fetchAgain} />}
        {user && (
          <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
      </Box>
    </div>


  );
};

export default ChatPage;
