import { Avatar, Box, Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerOverlay, Input, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Spinner, Text, Tooltip, useToast } from '@chakra-ui/react'

import { BellIcon, ChevronDownIcon, CloseIcon } from '@chakra-ui/icons'
import { useDisclosure } from '@chakra-ui/hooks'

import React, { useState } from 'react'
import { ChatState } from '../../context/chatContext';
import ProfileModal from './ProfileModal';
import { useNavigate } from 'react-router';
import axios from "axios"
import ChatLoading from './ChatLoading';
import UserListItem from './UserListItem';
import { getSender } from '../../config/chatLogic';
import NotificationBadge, { Effect } from "react-notification-badge";

const SideBar = () => {


  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();


  const { setSelectedChat,
    user,
    chats,
    setChats,
    notification, setNotification } = ChatState()
  const navigate = useNavigate()


  const handleLogout = () => {
    localStorage.removeItem("userInfo")
    navigate("/")

  }
  const toast = useToast()
  const handleSearch = async () => {
    if (!search) {
      toast({
        title: 'Please Enter something in search',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: "top-left"
      })
      return;
    }

    try {

      setLoading(true)
      const Config = {
        headers: {
          authorization: `Bearer ${user.token}`
        },
      }

      const sr = await axios.get(`/api/users?search=${search}`, Config)

      setLoading(false)
      setSearchResult(sr.data)
    } catch (error) {
      toast({
        title: 'Error occusred search !',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: "bottom-left"
      })
    }
  }

  const accessChat = async (userId) => {
    try {

      setLoadingChat(true)

      const Config = {
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${user.token}`
        },
      }

      const { data } = await axios.post("/chat", { userId }, Config)
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);

      setSelectedChat(data)
      setLoadingChat(false)
      onClose()
    } catch (error) {
      toast({
        title: 'Error occusred allChat!',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: "bottom-left"
      })
    }
  }
  return (
    <>
      <Box
        display={"flex"}
        bg={'#151515'}
        w={'100vw'}
        p={'5px 10px'}
        borderWidth={'2px'}
        justifyContent={'space-between'}
        alignItems={'center'}
        borderRadius={'5px'}
        color={"#ccc"}

      >


        <Tooltip label="search users to chat" placement='bottom-end' >

          <Button onClick={onOpen} className='ChatBoxBtn'>
            <i className="fa fa-search" aria-hidden="true"></i>
            <Text display={{ base: "none", md: "flex" }} ml={2}>
              search user
            </Text>
          </Button>


        </Tooltip>

        <Text fontSize={'3xl'} className='HeadingBox' >
        ChatX
        </Text>

        <div className="menu">
          <Menu>
          <MenuButton p={1}>
              <NotificationBadge
                count={notification.length}
                effect={Effect.SCALE}
              />
              <BellIcon fontSize="2xl" m={1} />
            </MenuButton>
            <MenuList pl={2} color={"black"}>
              {!notification.length && "No New Messages"}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton as={Button} bg="white" rightIcon={<ChevronDownIcon />} className='ChatBoxBtn'>
              <Avatar
                size="sm"
                cursor="pointer"
                name={user.name}
                src={user.pic}
              />
            </MenuButton>
            <MenuList>

              <ProfileModal user={user}>
                <MenuItem color={"black"}>My Profile</MenuItem>{" "}
              </ProfileModal>

              <MenuDivider />
              <MenuItem onClick={handleLogout} color={"black"}>Logout</MenuItem>
            </MenuList>
          </Menu>

        </div>

      </Box>

      <Drawer
        placement='left'
        onClose={onClose}
        isOpen={isOpen}>

        <DrawerOverlay />
        <DrawerContent>

          <DrawerHeader display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
          <Text>

          Search users...
          </Text>
          <Button onClick={onClose} >
          <CloseIcon ></CloseIcon>
              </Button>
              </DrawerHeader>
          

          <DrawerBody>
            <Box display={'flex'} pb={2} >

              <Input
                placeholder='search by name / email'
                mr={2}
                value={search}
                onChange={(e) => setSearch(e.target.value)}>

              </Input>

              <Button onClick={handleSearch}>
                Go
              </Button>

            </Box>

            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => accessChat(user._id)}
                />
              ))
            )}

            {loadingChat && <Spinner ml={'auto'} display={'flex'} />}
          </DrawerBody>

        </DrawerContent>





      </Drawer>


    </>
  )
}

export default SideBar
