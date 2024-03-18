import React, { useEffect } from 'react'
import { Container, Box, Tabs, TabList, Tab, TabPanel, TabPanels } from '@chakra-ui/react'
import Login from '../components/Authentication/Login'
import Signup from '../components/Authentication/Signup'
import { useNavigate } from 'react-router'
import '../App.css'
const Homepage = () => {

  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    // If user is not logged in, redirect to the login page
    if (userInfo) {
      navigate("/chats"); // Redirect to the login page
    }
  }, [navigate]);


  return (
    <>

      <Container maxW={"xl"}  >

        <Box
          d="flex"
          justifyContent='center'
          p={3}
          
          w={'100%'}
          m={'40px 0px 15px '}
          borderWidth={'1px'}
          borderRadius={'lg'}
          textAlign={'center'}
          fontFamily={'monospace'}
          fontSize={'3xl'}
          className='HomePageBox'
        >
          Welcome...!
        </Box>

        <Box w={"100%"} borderRadius={'lg'}
          borderWidth={'1px'} p={4}
          backgroundColor={'ButtonFace'}
          bg={'#151515'}>
          <Tabs variant='soft-rounded' 
          colorScheme='cyan'
          color={'#0077b6'}>
            <TabList>
              <Tab width={"50%"} >Login</Tab>
              <Tab width={"50%"} >SignUp</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Login>

                </Login>
              </TabPanel>
              <TabPanel>
                <Signup>

                </Signup>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>


      </Container>

    </>
  )
}

export default Homepage
