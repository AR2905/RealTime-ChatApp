const mongoose = require("mongoose");

const MsgSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    content: {
      type: String,
      trim: true,
    },
    attachment: {
      url: { type: String },
      type: { type: String, enum: ["image", "file"] },
      name: { type: String },
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chats",
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    edited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MsgModel = mongoose.model("messages", MsgSchema);

module.exports = MsgModel;