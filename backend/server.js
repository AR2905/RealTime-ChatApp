const express = require("express") 
const dotenv = require("dotenv") 
const colors = require("colors")
const userRouter = require("./Routes/UserRoute")
const ApiRouter = require("./Routes/ApiRoute")
const ChatRouter = require("./Routes/ChatRoutes")
const messageRoutes = require("./Routes/messageRoutes")
const path = require("path")
const app = express()

const ConnectDb = require("./connection")
const { notFound, errorHandler } = require("./Middlewares/errorMiddleware")
const { protect } = require("./Middlewares/ProtectMiddleware")

dotenv.config()
ConnectDb()
const port = process.env.PORT
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use("/user" ,userRouter )


app.use("/api", protect, ApiRouter);
app.use("/chat", protect, ChatRouter);
app.use("/message", protect, messageRoutes);


// ======================

const __dirname1 = path.resolve();
if(process.env.NODE_ENV==='production'){
    app.use(express.static(path.join(__dirname1, '/frontend/build')))

    app.get('*' , (req, res) => {
        res.sendFile(path.resolve(__dirname1,"frontend","build","index.html"))
    })
}
else{
    app.get("/" , (req , res ) => {
        res.send("api is Running...")
    })
}

// =========================


app.use(notFound)
app.use(errorHandler)
const server = app.listen(port , ()=>{
    console.log(`Server Running at http://localhost:${port}`.blue.bold)
})

const io = require("socket.io")(server,{
    pingTimeout : 60000, 
    cors:
    {
        origin:  `https://chatx-7yko.onrender.com/`
    }
})

io.on("connection" , (socket) => {

    socket.on('setup' , (userData) => {
        socket.join(userData._id)
        socket.emit("connected")
    })

    socket.on("join chat" , (room)=>{
        socket.join(room)
    }) 

    socket.on("new msg" , (newMessageRecieved)=>{
       
        var chat  = newMessageRecieved.chat

        if(!chat.users) return console.log("Chat user not defined");


        chat.users.forEach(user =>{
            if(user._id == newMessageRecieved.sender._id) return;

            socket.in(user._id).emit('msg recieved', newMessageRecieved)
        }) 
    }) 

    socket.on("typing" , (room) => {
        socket.in(room).emit("typing")
    })

    socket.on("stop typing" , (room) => {
        socket.in(room).emit("stop typing")
    })

    socket.off("setup" , ()=>{
        socket.leave(userData._id)
    })
})
