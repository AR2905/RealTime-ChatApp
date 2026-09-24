const expressAsyncHandler = require("express-async-handler");
const MsgModel = require("../model/msgModel");
const UserModel = require("../model/UserModel");
const ChatModel = require("../model/chatModel");

const sendMessage = expressAsyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
      console.log("Invalid data passed into request");
      return res.sendStatus(400);
  }

  try {
      // Create a new message
      const newMessage = {
          sender: req.user._id,
          content: content,
          chat: chatId,
      };
      const message = await MsgModel.create(newMessage);

      // Populate sender, chat, and users fields in the message
      await message.populate("sender", "name pic")
      await message.populate("chat")
      await UserModel.populate(message, { path: "chat.users", select: "name pic email" });

      // Update the latestMessage field in the chat
      const chat = await ChatModel.findByIdAndUpdate(chatId, { latestMessage: message });

      if (!chat) {
          console.log("Chat document with ID", chatId, "not found.");
          return res.status(404).json({ message: "Chat not found" });
      }

      res.json(message);
  } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: error.message });
  }
});



const allMessages = expressAsyncHandler(async (req, res) => {
  try {
    const messages = await MsgModel.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  sendMessage,
  allMessages,
};
