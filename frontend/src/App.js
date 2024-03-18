import { Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import Homepage from "./pages/Homepage";
import './App.css'
function App() {

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/chats" element={<ChatPage />} />
    </Routes>
  );
}

export default App;
