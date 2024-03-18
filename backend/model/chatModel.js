// chatName
// isGroupChat
// users
// lastestMsg
// GroupAdmin

const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({

    chatName : {
        type : String ,
        trim : true
    },

    isGroupChat :{
        type : Boolean,
        default  : false
    },
    users :[{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users'
    },
 ],

    latestMessage :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'messages'
    },
    GroupAdmin :{
        
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users'
    },

    

} , {timestamps : true})

const ChatModel = mongoose.model("chats" , ChatSchema)

module.exports = ChatModel