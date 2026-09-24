import React, { useState } from "react";
import { Input, VStack } from "@chakra-ui/react";
import { FormControl, FormLabel } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [confirmpassword, setConfirmpass] = useState("");
  const [pic, setPic] = useState();
  const [picLoading, setPicLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmpassword) {
      toast({
        title: "Please Fill all the Fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    if (password !== confirmpassword) {
      toast({
        title: "Passwords Do Not Match",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/user/signup",
        {
          name,
          email,
          password,
          pic,
        },
        config
      );
      
      toast({
        title: "Registration Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const postDetails = (pics) => {
    if (pics === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    if (pics.type === "image/jpeg" || pics.type === "image/png") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "ChatApp");
      data.append("cloud_name", "dibv4yamb");
      setPicLoading(true); // Start loading when file is selected
      fetch("https://api.cloudinary.com/v1_1/dibv4yamb/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setPic(data.url.toString());
          setPicLoading(false); // Stop loading after image URL is obtained
        })
        .catch((err) => {
          console.log(err);
          setPicLoading(false);
        });
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
  };

  const handleFileChange = (e) => {
    postDetails(e.target.files[0]);
  };

  return (
    <>
      <VStack spacing={"10px"}>
        <FormControl id="name">
          <FormLabel textColor={"gray"}>Name :</FormLabel>
          <Input
            placeholder="Enter your name..."
            type="text"
            onChange={(e) => setName(e.target.value)}
          />
        </FormControl>

        <FormControl id="email">
          <FormLabel textColor={"gray"}>Email :</FormLabel>
          <Input
            placeholder="mail@example.com"
            type="text"
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>

        <FormControl id="password">
          <FormLabel textColor={"gray"}>Password :</FormLabel>
          <Input
            placeholder="Enter Password..."
            type="password"
            onChange={(e) => setPass(e.target.value)}
          />
        </FormControl>

        <FormControl id="confirmpassword">
          <FormLabel textColor={"gray"}>Re-Enter Password :</FormLabel>
          <Input
            placeholder="re-enter password..."
            type="password"
            onChange={(e) => setConfirmpass(e.target.value)}
          />
        </FormControl>

        <FormControl id="pic">
          <FormLabel
            textColor={"gray"}
            className="ChooseButton"
            display={"flex"}
            border={"1px solid cyan"}
            p={2}
            borderRadius={"lg"}
            _hover={{ bg: "#000", color: "white", borderColor: "black"
            
             }}
            width={"max-content"}
          >
            Choose Your Profile Picture
          </FormLabel>
          <Input
            type="file"
            accept="images/*"
            display={"none"}
           
            onChange={handleFileChange}
          />
        </FormControl>

        <Button
          colorScheme="telegram"
          width={"100%"}
          marginTop={5}
          onClick={handleSubmit}
          isLoading={picLoading}
        >
          SignUp
        </Button>
      </VStack>
    </>
  );
};

export default Signup;
