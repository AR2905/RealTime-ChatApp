const UserModel = require("../model/UserModel");
const MsgModel = require("../model/msgModel");
const ChatModel = require("../model/chatModel");

const GetCookieInfo = async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};

const GetAllUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
        _id: { $ne: req.user._id, $nin: req.user.blocked || [] },
      }
    : { _id: { $ne: req.user._id, $nin: req.user.blocked || [] } };

  const users = await UserModel.find(keyword).select(
    "name email pic online lastSeen isVerified authProvider"
  );
  res.send(users);
};

// Unread message count per chat, grouped.
const getUnreadCounts = async (req, res) => {
  const chats = await ChatModel.find({ users: req.user._id }).select("_id");
  const chatIds = chats.map((c) => c._id);

  if (!chatIds.length) return res.json({ counts: [] });

  const raw = await MsgModel.aggregate([
    {
      $match: {
        chat: { $in: chatIds },
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
    },
    {
      $group: {
        _id: "$chat",
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = raw.map((r) => ({ chatId: r._id, count: r.count }));
  res.json({ counts });
};

module.exports = { GetCookieInfo, GetAllUsers, getUnreadCounts };