import { io } from "socket.io-client";

let socket = null;
let socketToken = null;

const ENDPOINT = process.env.REACT_APP_SOCKET_URL || "";

export const getSocket = (user) => {
  const token = user?.token;
  if (socket && socketToken === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketToken = token;
  socket = io(ENDPOINT, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
};