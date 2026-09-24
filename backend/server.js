const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const http = require("http");

dotenv.config();

const ConnectDb = require("./connection");
const userRouter = require("./Routes/UserRoute");
const ApiRouter = require("./Routes/ApiRoute");
const ChatRouter = require("./Routes/ChatRoutes");
const messageRoutes = require("./Routes/messageRoutes");
const { notFound, errorHandler } = require("./Middlewares/errorMiddleware");
const { protect } = require("./Middlewares/ProtectMiddleware");
const { apiLimiter } = require("./config/rateLimiters");
const UserModel = require("./model/UserModel");

const app = express();
ConnectDb();

const port = process.env.PORT || 8001;

// ------- Security / parsing -------
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = (process.env.FRONTEND_URL || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      allowed.push("https://chat-book-x.vercel.app", "http://localhost:3000");
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ------- Routes -------
app.get("/", (req, res) => {
  res.send("API is Running...");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/user", userRouter);
app.use("/api", protect, ApiRouter);
app.use("/chat", protect, ChatRouter);
app.use("/message", protect, messageRoutes);

app.use(notFound);
app.use(errorHandler);

// ------- Server + Socket.io -------
const server = http.createServer(app);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: (process.env.FRONTEND_URL || "https://chat-book-x.vercel.app")
      .split(",")
      .map((s) => s.trim()),
    credentials: true,
  },
});

// Presence tracking: userId -> Set of socket ids
const onlineUsers = new Map();

const verifySocketToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SEC);
  } catch (e) {
    return null;
  }
};

const registerPresence = (socket, userId) => {
  socket.data.userId = userId;
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  UserModel.findByIdAndUpdate(userId, { online: true, lastSeen: new Date() }).exec();
  socket.join(userId.toString());
  io.emit("user presence", { userId, online: true, lastSeen: null });
};

const clearPresence = async (socket) => {
  const userId = socket.data.userId;
  if (!userId) return;
  const set = onlineUsers.get(userId);
  if (set) {
    set.delete(socket.id);
    if (set.size === 0) {
      onlineUsers.delete(userId);
      const lastSeen = new Date();
      await UserModel.findByIdAndUpdate(userId, {
        online: false,
        lastSeen,
      }).exec();
      io.emit("user presence", { userId, online: false, lastSeen });
    }
  }
};

io.on("connection", (socket) => {
  // Try to authenticate via handshake token
  const decoded = verifySocketToken(socket.handshake?.auth?.token);
  socket.data.userId = decoded ? decoded._id : null;
  if (socket.data.userId) {
    registerPresence(socket, socket.data.userId);
    socket.emit("connected");
  }

  socket.on("setup", async (userData) => {
    if (!userData || !userData._id) return;
    const decoded = verifySocketToken(userData.token);
    const userId = decoded ? decoded._id : userData._id;
    registerPresence(socket, userId);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    if (room) socket.join(room);
  });

  socket.on("leave chat", (room) => {
    if (room) socket.leave(room);
  });

  socket.on("new msg", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    if (!chat || !chat.users) return console.log("Chat user not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("msg recieved", newMessageRecieved);
    });
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("msg read", (payload) => {
    if (payload?.chatId && payload?.userId) {
      socket.in(payload.chatId).emit("messages read", payload);
    }
  });

  socket.on("message edited", (payload) => {
    if (payload?.chatId && payload?.message) {
      socket.in(payload.chatId).emit("message edited", payload.message);
    }
  });

  socket.on("message deleted", (payload) => {
    if (payload?.chatId && payload?.messageId) {
      socket.in(payload.chatId).emit("message deleted", payload.messageId);
    }
  });

  socket.on("message reacted", (payload) => {
    if (payload?.chatId && payload?.messageId) {
      socket.in(payload.chatId).emit("message reacted", {
        messageId: payload.messageId,
        reactions: payload.reactions,
      });
    }
  });

  socket.on("disconnect", () => {
    clearPresence(socket);
  });
});

server.listen(port, () => {
  console.log(`Server Running at http://localhost:${port}`.blue.bold);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});