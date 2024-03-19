import React, { useEffect, useState } from 'react'
import { ChatState } from '../../context/chatContext'
import { Box, Button, FormControl, IconButton, Input, Spinner, Text, useToast } from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'
import {getSender , getSenderFull} from '../../config/chatLogic'
import ProfileModal from './ProfileModal'
import UpdateGroupChatModal from './UpdateGroupChatModal'
import axios from 'axios'
import ScrollableChat from './ScrollableChat'
import animationData from '../../Animations/typing.json'
import Lottie from 'react-lottie'
import io from 'socket.io-client'
const  ENDPOINT = "https://chatx-7yko.onrender.com"

var socket, selectedChatCompare ;



const SingleChat = ({ fetchAgain, setFetchAgain }) => {

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const toast = useToast()
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    };

  const fetchMessages = async()=>{
    if(!selectedChat ) return

    try {
      const config = {
        headers: {
          
          authorization: `Bearer ${user.token}`,
        },
      }

      setLoading(true)

      const {data} = await axios.get(`/message/${selectedChat._id}`, config
      )


      setMessages(data)

      setLoading(false)

      socket.emit("join chat" , selectedChat._id)

    } catch (error) {
      toast({
        title: "Error",
        description:"Failed to load the msgs",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  }

  useEffect(()=>{
    socket = io(ENDPOINT)
    socket.emit("setup" ,user)
    socket.on("connected" , () =>{
      setSocketConnected(true)
    })    

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
     // eslint-disable-next-line
  }, [])



  useEffect(()=>{
    fetchMessages()
    selectedChatCompare = selectedChat
     // eslint-disable-next-line
  }, [selectedChat])

  
  useEffect(() => {
    socket.on("msg recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        // notification logic
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const sendMsgOnClick = async () =>{

      socket.emit('stop typing' , selectedChat._id)

      const trimmedMessage = newMessage.trim();

      if(!newMessage || !trimmedMessage ) return

      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            authorization: `Bearer ${user.token}`,
          },
        }

        setNewMessage("")


        const {data} = await axios.post('/message'  , {
          content:newMessage,
          chatId : selectedChat._id
        },  config)

        socket.emit("new msg" , data )
        setMessages([...messages , data])
      } catch (error) {
        toast({
              title: "Msg not sent",
              status: "error",
              duration: 5000,
              isClosable: true,
              position: "bottom",
            });
      }


  }


  const sendMessage = async(e) =>{

    const trimmedMessage = newMessage.trim();

    if(!trimmedMessage) return

    if(e.key === 'Enter' && newMessage ){
      socket.emit('stop typing' , selectedChat._id)
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            authorization: `Bearer ${user.token}`,
          },
        }

        setNewMessage("")


        const {data} = await axios.post('/message'  , {
          content:newMessage,
          chatId : selectedChat._id
        },  config)

        socket.emit("new msg" , data )
        setMessages([...messages , data])
      } catch (error) {
        toast({
              title: "Msg not sent",
              status: "error",
              duration: 5000,
              isClosable: true,
              position: "bottom",
            });
      }
    }

  }

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


  return (
    <>
    {selectedChat ? (
        <>
        <Text
        className='ChatBoxUserName'
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >

<IconButton className='SingleChatBtn'
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />

            {
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))
            }
          </Text>

          <Box 
          className='forSingleChatsize'
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
            {/* {MSGS here} */}

            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
                color='cyan'
              />
            ) : (
              <Box
                className="messages"
  display="flex"
  flexDirection="column"
  overflowY="scroll"
  sx={{
    "&::-webkit-scrollbar": {
      display: "none" // Hide the scrollbar for WebKit browsers
    },
    scrollbarWidth: "none" // Hide the scrollbar for Firefox
  }}
>
  <ScrollableChat messages={messages} />
</Box>
            )}

            <FormControl
            onKeyDown={sendMessage}
            isRequired
            mt={3}
         
            >
             {istyping ? <div>
            <div  
    style={{ marginBottom: 15, marginLeft: 0 , display:"inline-block"}} >
            <Lottie  
    options={defaultOptions}
    // height={50}
    width={70}
    
/>
            </div>
             </div> : <></>}
            <Input
                 className='ChatBoxInput'
               variant="filled"
  bg="#0c192c"
  placeholder="Enter a message.."
  _hover={{
    backgroundColor: "black" // Corrected syntax: Use ":" instead of "="
  }}
  value={newMessage}
  onChange={typingHandler}
  color={"white"}
            />
            <Button 

            className='sendingBtn'
            position={"absolute"}
            zIndex={9}
            right={0}
            display={'inline-block'}
color={"#00717f"}
            backgroundColor={"#212121"}
            borderTopLeftRadius={0}
            borderBottomLeftRadius={0}

             onClick={()=>{
              sendMsgOnClick()
            }}>
<i className="fa-solid fa-paper-plane"></i>
            </Button>

            </FormControl>

            
          </Box>

        </>
    ) : <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>

        </Box>}
    </>
  )
}

export default SingleChat
