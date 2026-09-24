import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import ChatProvider from "./context/chatContext";
import axios from "axios";

axios.defaults.baseURL = process.env.REACT_APP_API_URL || "";


const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
<ChakraProvider>
  
    <BrowserRouter>
  <ChatProvider>

        <App />
  </ChatProvider>

    </BrowserRouter>
    </ChakraProvider>
  

);

reportWebVitals();
