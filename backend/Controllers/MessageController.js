const expressAsyncHandler = require("express-async-handler");
const MsgModel = require("../model/msgModel");
const UserModel = require("../model/UserModel");
const ChatModel = require("../model/chatModel");
const ReactionModel = require("../model/reactionModel");

const attachReactions = async (messages) => {
  if (!messages || !messages.length) return messages;
  const ids = messages.map((m) => m._id);
  const reactions = await ReactionModel.find({ message: { $in: ids } }).populate(
    "user",
    "name pic email"
  );

  const map = {};
  reactions.forEach((r) => {
    if (!map[r.message.toString()]) map[r.message.toString()] = [];
    map[r.message.toString()].push({
      _id: r._id,
      user: r.user,
      emoji: r.emoji,
    });
  });

  return messages.map((m) => {
    const doc = m.toObject ? m.toObject() : m;
    return { ...doc, reactions: map[m._id.toString()] || [] };
  });
};

const isBlockedBetween = (userA, userB) => {
  if (!userA || !userB) return false;
  const a = (userA.blocked || []).map((x) => x.toString());
  const b = (userB.blocked || []).map((x) => x.toString());
  return a.includes(userB._id.toString()) || b.includes(userA._id.toString());
};

// ---------------- SEND MESSAGE ----------------
const sendMessage = expressAsyncHandler(async (req, res) => {
  const { content, chatId, attachment } = req.body;

  if ((!content || !content.trim()) && !(attachment && attachment.url)) {
    return res.status(400).json({ message: "Message content or attachment is required." });
  }

  const chat = await ChatModel.findById(chatId).populate("users");
  if (!chat) return res.status(404).json({ message: "Chat not found." });

  if (!chat.users.some((u) => u._id.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: "You are not part of this chat." });
  }

  if (!chat.isGroupChat) {
    const other = chat.users.find((u) => u._id.toString() !== req.user._id.toString());
    const blocked = isBlockedBetween(req.user, other);
    if (blocked) {
      return res.status(403).json({ message: "You cannot message this user." });
    }
  }

  const newMessage = {
    sender: req.user._id,
    content: (content || "").trim(),
    chat: chatId,
  };
  if (attachment && attachment.url) {
    newMessage.attachment = {
      url: attachment.url,
      type: attachment.type === "file" ? "file" : "image",
      name: attachment.name,
    };
  }

  const message = await MsgModel.create(newMessage);
  await message.populate("sender", "name pic");
  await message.populate("chat");
  await UserModel.populate(message, { path: "chat.users", select: "name pic email" });

  const [withReactions] = await attachReactions([message]);
  const result = withReactions;

  await ChatModel.findByIdAndUpdate(chatId, {
    latestMessage: message._id,
  });

  res.json(result);
});

// ---------------- ALL MESSAGES (paginated) ----------------
const allMessages = expressAsyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);
  const skip = Math.max(parseInt(req.query.skip) || 0, 0);

  const total = await MsgModel.countDocuments({ chat: req.params.chatId });

  const messages = await MsgModel.find({ chat: req.params.chatId })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "name pic email")
    .populate({
      path: "chat",
      populate: { path: "users", select: "name pic email" },
    });

  const withReactions = await attachReactions(messages);
  res.json({ messages: withReactions, total, hasMore: skip + limit < total });
});

// ---------------- SEARCH MESSAGES ----------------
const searchMessages = expressAsyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json({ messages: [] });

  const messages = await MsgModel.find({
    chat: req.params.chatId,
    content: { $regex: q.trim(), $options: "i" },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("sender", "name pic email")
    .populate({
      path: "chat",
      populate: { path: "users", select: "name pic email" },
    });

  const withReactions = await attachReactions(messages);
  res.json({ messages: withReactions });
});

// ---------------- EDIT MESSAGE ----------------
const editMessage = expressAsyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Message content cannot be empty." });
  }

  const message = await MsgModel.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: "Message not found." });
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only edit your own messages." });
  }

  message.content = content.trim();
  message.edited = true;
  await message.save();
  await message.populate("sender", "name pic");
  await message.populate({
    path: "chat",
    populate: { path: "users", select: "name pic email" },
  });

  const [withReactions] = await attachReactions([message]);
  res.json(withReactions);
});

// ---------------- DELETE MESSAGE ----------------
const deleteMessage = expressAsyncHandler(async (req, res) => {
  const message = await MsgModel.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: "Message not found." });
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only delete your own messages." });
  }

  await ReactionModel.deleteMany({ message: message._id });
  await MsgModel.findByIdAndDelete(message._id);

  const chat = await ChatModel.findById(message.chat).populate("latestMessage");
  if (chat && chat.latestMessage && chat.latestMessage._id.toString() === message._id.toString()) {
    const latest = await MsgModel.findOne({ chat: message.chat })
      .sort({ createdAt: -1 })
      .populate("sender", "name pic email");
    chat.latestMessage = latest ? latest._id : undefined;
    await chat.save();
  }

  res.json({ message: "Message deleted.", deletedId: message._id });
});

// ---------------- REACT ----------------
const addReaction = expressAsyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const message = await MsgModel.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: "Message not found." });

  const existing = await ReactionModel.findOne({
    message: message._id,
    user: req.user._id,
    emoji,
  });
  if (existing) {
    await ReactionModel.findByIdAndDelete(existing._id);
  } else {
    await ReactionModel.create({
      message: message._id,
      user: req.user._id,
      emoji,
    });
  }

  const reactions = await ReactionModel.find({ message: message._id }).populate(
    "user",
    "name pic"
  );
  res.json({ messageId: message._id, reactions });
});

// ---------------- MARK READ ----------------
const markMessagesRead = expressAsyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const result = await MsgModel.updateMany(
    {
      chat: chatId,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({ ok: true, modified: result.modifiedCount, chatId });
});

module.exports = {
  sendMessage,
  allMessages,
  searchMessages,
  editMessage,
  deleteMessage,
  addReaction,
  markMessagesRead,
};