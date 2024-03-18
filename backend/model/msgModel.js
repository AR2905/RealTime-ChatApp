// sender
// content
// chat

const mongoose = require('mongoose');


const MsgSchema = mongoose.Schema({

    sender : {
       
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users'
    },

    content :{
        type : String,
        trim : true
    },

    chat: {

        type : mongoose.Schema.Types.ObjectId,
        ref : 'chats'
    },
    
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],

} , {timestamps : true})

const MsgModel = mongoose.model("messages" , MsgSchema)

module.exports = MsgModel