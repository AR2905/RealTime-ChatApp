const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const UserModel = require("../model/UserModel");
const ChatModel = require("../model/chatModel");
const MsgModel = require("../model/msgModel");
const ReactionModel = require("../model/reactionModel");
const OtpModel = require("../model/otpModel");
const { publicUser } = require("./HandleAuthUtils");

const isExistingHash = (pw) => pw && pw.startsWith("$2");

// ---------------- UPDATE PROFILE ----------------
const updateProfile = expressAsyncHandler(async (req, res) => {
  const { name, pic } = req.body;
  const user = req.user;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 3) {
      res.status(400);
      throw new Error("Name must be at least 3 characters long.");
    }
    user.name = name.trim();
  }
  if (pic !== undefined && typeof pic === "string" && pic.trim()) {
    user.pic = pic.trim();
  }

  await user.save();
  res.json({ user: publicUser(user) });
});

// ---------------- CHANGE PASSWORD ----------------
const changePassword = expressAsyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  if (!newPassword) {
    res.status(400);
    throw new Error("New password is required.");
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters long.");
  }
  if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    res.status(400);
    throw new Error("New password must contain at least one letter and one number.");
  }
  if (currentPassword && newPassword === currentPassword) {
    res.status(400);
    throw new Error("New password must be different from the current one.");
  }

  if (!user.password) {
    res.status(400);
    throw new Error("This account uses Google sign-in and has no password.");
  }

  let ok = false;
  if (isExistingHash(user.password)) {
    ok = await bcrypt.compare(currentPassword || "", user.password);
  } else if (user.salt) {
    const { createHash } = require("crypto");
    const legacy = createHash("sha256")
      .update((currentPassword || "") + user.salt)
      .digest("hex");
    ok = legacy === user.password;
  }

  if (!currentPassword || !ok) {
    res.status(400);
    throw new Error("Current password is incorrect.");
  }

  user.password = newPassword;
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  res.json({ message: "Password changed successfully." });
});

// ---------------- BLOCK / UNBLOCK ----------------
const blockUser = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId || userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("Invalid user.");
  }

  const target = await UserModel.findById(userId);
  if (!target) {
    res.status(404);
    throw new Error("User not found.");
  }

  if (!req.user.blocked.includes(userId)) {
    req.user.blocked.push(userId);
    await req.user.save();
  }

  const sharedChats = await ChatModel.find({
    isGroupChat: false,
    users: { $all: [req.user._id, userId] },
  }).select("_id");

  if (sharedChats.length) {
    const chatIds = sharedChats.map((c) => c._id);
    const msgIds = (await MsgModel.find({ chat: { $in: chatIds } }).select("_id")).map(
      (m) => m._id
    );
    if (msgIds.length) await ReactionModel.deleteMany({ message: { $in: msgIds } });
    await MsgModel.deleteMany({ chat: { $in: chatIds } });
    await ChatModel.deleteMany({ _id: { $in: chatIds } });
  }

  res.json({ message: "User blocked.", blocked: req.user.blocked });
});

const unblockUser = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  req.user.blocked = req.user.blocked.filter((id) => id.toString() !== userId);
  await req.user.save();
  res.json({ message: "User unblocked.", blocked: req.user.blocked });
});

// ---------------- DELETE ACCOUNT ----------------
const deleteAccount = expressAsyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = req.user;

  if (user.password) {
    let ok = false;
    if (isExistingHash(user.password)) {
      ok = await bcrypt.compare(password || "", user.password);
    } else if (user.salt) {
      const { createHash } = require("crypto");
      const legacy = createHash("sha256")
        .update((password || "") + user.salt)
        .digest("hex");
      ok = legacy === user.password;
    }
    if (!password || !ok) {
      res.status(400);
      throw new Error("Password is incorrect.");
    }
  }

  const chatIds = (await ChatModel.find({ users: user._id }).select("_id")).map((c) => c._id);
  const msgIds = chatIds.length
    ? (await MsgModel.find({ chat: { $in: chatIds } }).select("_id")).map((m) => m._id)
    : [];
  if (msgIds.length) {
    await ReactionModel.deleteMany({ message: { $in: msgIds } });
  }
  if (chatIds.length) {
    await MsgModel.deleteMany({ chat: { $in: chatIds } });
    await ChatModel.deleteMany({ _id: { $in: chatIds } });
  }

  await ReactionModel.deleteMany({ user: user._id });
  await OtpModel.deleteMany({ email: user.email });
  await UserModel.findByIdAndDelete(user._id);

  res.clearCookie("token");
  res.json({ message: "Account deleted." });
});

module.exports = {
  updateProfile,
  changePassword,
  blockUser,
  unblockUser,
  deleteAccount,
};