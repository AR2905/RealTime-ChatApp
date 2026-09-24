const expressAsyncHandler = require("express-async-handler");
const ChatModel = require("../model/chatModel");
const UserModel = require("../model/UserModel");
const MsgModel = require("../model/msgModel");
const ReactionModel = require("../model/reactionModel");

const fetchChats = expressAsyncHandler(async (req, res) => {
  const results = await ChatModel.find({ users: { $elemMatch: { $eq: req.user._id } } })
    .populate("users", "-password -salt")
    .populate("GroupAdmin", "-password -salt")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .exec();

  await UserModel.populate(results, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  res.status(200).send(results);
});

const accessChats = expressAsyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.sendStatus(400);

  const targetUser = await UserModel.findById(userId);
  if (!targetUser) return res.status(404).json({ message: "User not found." });

  const blockedByMe = (req.user.blocked || []).some((b) => b.toString() === userId);
  const blockedMe = (targetUser.blocked || []).some((b) => b.toString() === req.user._id.toString());
  if (blockedByMe || blockedMe) {
    return res.status(403).json({
      message: blockedByMe
        ? "You have blocked this user."
        : "You cannot start a chat with this user.",
    });
  }

  let isChat = await ChatModel.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password -salt")
    .populate("latestMessage");

  isChat = await UserModel.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    const createdChat = await ChatModel.create(chatData);
    const FullChat = await ChatModel.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password -salt"
    );
    res.status(200).json(FullChat);
  }
});

const createGroupChat = expressAsyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill in all the fields." });
  }

  let users;
  try {
    users = JSON.parse(req.body.users);
  } catch (e) {
    return res.status(400).send({ message: "Invalid users list." });
  }

  if (users.length < 2) {
    return res.status(400).send("More than 2 users are required to form a group chat.");
  }

  const validUsers = await UserModel.find({ _id: { $in: users } }).select("_id");
  if (validUsers.length !== new Set(users).size) {
    return res.status(400).send({ message: "One or more selected users no longer exist." });
  }

  users.push(req.user._id);

  const groupChat = await ChatModel.create({
    chatName: req.body.name.trim(),
    users,
    isGroupChat: true,
    GroupAdmin: req.user._id,
  });

  const fullGroupChat = await ChatModel.findOne({ _id: groupChat._id })
    .populate("users", "-password -salt")
    .populate("GroupAdmin", "-password -salt");

  res.status(200).json(fullGroupChat);
});

const renameGroupChat = expressAsyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  if (!chatName || !chatName.trim()) {
    return res.status(400).json({ message: "Group name cannot be empty." });
  }

  const chat = await ChatModel.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found." });
  if (chat.GroupAdmin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the group admin can rename the group." });
  }

  const updatedChat = await ChatModel.findByIdAndUpdate(
    chatId,
    { chatName: chatName.trim() },
    { new: true }
  )
    .populate("users", "-password -salt")
    .populate("GroupAdmin", "-password -salt");

  res.json(updatedChat);
});

const updateGroupPic = expressAsyncHandler(async (req, res) => {
  const { chatId, groupPic } = req.body;
  const chat = await ChatModel.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found." });
  if (chat.GroupAdmin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the group admin can change the group picture." });
  }
  if (!groupPic) return res.status(400).json({ message: "Picture URL is required." });

  const updated = await ChatModel.findByIdAndUpdate(
    chatId,
    { groupPic },
    { new: true }
  )
    .populate("users", "-password -salt")
    .populate("GroupAdmin", "-password -salt");

  res.json(updated);
});

const isGroupAdmin = (chat, userId) => {
  if (!chat.isGroupChat || !chat.GroupAdmin) return false;
  const adminId = chat.GroupAdmin._id
    ? chat.GroupAdmin._id.toString()
    : chat.GroupAdmin.toString();
  return adminId === userId.toString();
};

const removeFromGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await ChatModel.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found." });

  const isAdmin = isGroupAdmin(chat, req.user._id);
  const removingSelf = userId === req.user._id.toString();

  if (!isAdmin && !removingSelf) {
    return res.status(403).json({ message: "Only admins can remove others from the group." });
  }

  const removed = await ChatModel.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password -salt")
    .populate("GroupAdmin", "-password -salt");

  if (!removed) return res.status(404).json({ message: "Chat not found." });
  res.json(removed);
});

const addToGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await ChatModel.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found." });
  if (chat.isGroupChat && !isGroupAdmin(chat, req.user._id)) {
    return res.status(403).json({ message: "Only admins can add someone to the group." });
  }

  if (chat.users.includes(userId)) {
    return res.status(400).json({ message: "User is already in the group." });
  }

  const added = await ChatModel.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate("users", "-password -salt")
    .populate("GroupAdmin", "-password -salt");

  if (!added) return res.status(404).json({ message: "Chat not found." });
  res.json(added);
});

const deleteGroupChat = expressAsyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const chat = await ChatModel.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found." });
  if (!chat.isGroupChat) return res.status(400).json({ message: "Not a group chat." });
  if (chat.GroupAdmin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the admin can delete this group." });
  }

  const msgIds = (await MsgModel.find({ chat: chatId }).select("_id")).map((m) => m._id);
  if (msgIds.length) {
    await ReactionModel.deleteMany({ message: { $in: msgIds } });
    await MsgModel.deleteMany({ _id: { $in: msgIds } });
  }
  await ChatModel.findByIdAndDelete(chatId);

  res.json({ message: "Group deleted.", deletedId: chatId });
});

const transferAdmin = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await ChatModel.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found." });
  if (!chat.isGroupChat) return res.status(400).json({ message: "Not a group chat." });
  if (chat.GroupAdmin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the admin can transfer ownership." });
  }
  if (!chat.users.includes(userId)) {
    return res.status(400).json({ message: "User is not part of the group." });
  }

  const updated = await ChatModel.findByIdAndUpdate(
    chatId,
    { GroupAdmin: userId },
    { new: true }
  )
    .populate("users", "-password -salt")
    .populate("GroupAdmin", "-password -salt");

  res.json(updated);
});

module.exports = {
  fetchChats,
  accessChats,
  createGroupChat,
  renameGroupChat,
  updateGroupPic,
  removeFromGroup,
  addToGroup,
  deleteGroupChat,
  transferAdmin,
};