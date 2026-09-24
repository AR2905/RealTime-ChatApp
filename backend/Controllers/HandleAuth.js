const UserModel = require("../model/UserModel");
const { CreateToken } = require("../config/Token");
const { createAndSendOtp, verifyOtpToken } = require("../config/mailer");
const verifyGoogleToken = require("../config/googleVerify");
const { publicUser } = require("./HandleAuthUtils");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const getTokenAndUser = (user) => {
  const token = CreateToken(user);
  return { token, user: publicUser(user) };
};

// ---------------- SIGN UP ----------------
const HandleSignUp = async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }
  if (name.trim().length < 3) {
    return res.status(400).json({ message: "Name must be at least 3 characters long." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({
      message: "Password must contain at least one letter and one number.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({
      message: existing.isVerified
        ? "An account with this email already exists. Please log in."
        : "An account with this email exists but is not verified.",
      needsVerification: !existing.isVerified,
    });
  }

  const user = await UserModel.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    pic: pic || undefined,
  });

  const { dev } = await createAndSendOtp(user.email, "verify");

  res.status(201).json({
    message: "Account created. Please verify your email with the code we sent.",
    needsVerification: true,
    email: user.email,
    dev,
  });
};

// ---------------- LOGIN ----------------
const HandleLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const minsLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    return res.status(423).json({
      message: `Too many failed attempts. Account locked for ${minsLeft} minute(s).`,
    });
  }

  if (!user.password) {
    return res.status(400).json({
      message: "This account uses Google sign-in. Please continue with Google.",
    });
  }

  const { token, user: populated } = await UserModel.matchPassword(
    email.trim().toLowerCase(),
    password
  );

  if (!populated.isVerified) {
    const { dev } = await createAndSendOtp(populated.email, "verify");
    return res.status(403).json({
      message: "Please verify your email before logging in. We sent you a new code.",
      needsVerification: true,
      email: populated.email,
      dev,
    });
  }

  sendAuthCookie(res, token);
  return res.status(200).json({ token, user: publicUser(populated) });
};

// ---------------- GOOGLE OAUTH ----------------
const HandleGoogleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: "Google credential is required." });
  }

  const payload = await verifyGoogleToken(credential);

  let user = await UserModel.findOne({ email: payload.email.toLowerCase() });

  if (!user) {
    user = await UserModel.create({
      name: payload.name || payload.email.split("@")[0],
      email: payload.email.toLowerCase(),
      pic: payload.picture,
      isVerified: true,
      authProvider: "google",
      googleId: payload.sub,
    });
  } else {
    user.googleId = payload.sub;
    user.isVerified = true;
    if (!user.pic && payload.picture) user.pic = payload.picture;
    await user.save();
  }

  const token = CreateToken(user);
  sendAuthCookie(res, token);
  return res.status(200).json({ token, user: publicUser(user) });
};

// ---------------- VERIFY EMAIL / OTP ----------------
const HandleVerifyOtp = async (req, res) => {
  const { email, otp, purpose } = req.body;
  if (!email || !otp || !purpose) {
    return res.status(400).json({ message: "Email, OTP and purpose are required." });
  }
  if (!["verify", "reset"].includes(purpose)) {
    return res.status(400).json({ message: "Invalid OTP purpose." });
  }

  await verifyOtpToken(email.trim().toLowerCase(), otp.trim(), purpose);

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });

  // Verification logs the user in directly (good UX).
  if (purpose === "verify") {
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }
    if (user.isVerified) {
      const t = CreateToken(user);
      sendAuthCookie(res, t);
      return res.json({ message: "Email already verified.", token: t, user: publicUser(user) });
    }
    user.isVerified = true;
    await user.save();
    const { token, user: safe } = getTokenAndUser(user);
    sendAuthCookie(res, token);
    return res.json({ message: "Email verified successfully.", token, user: safe });
  }

  // purpose === "reset"
  if (!user) {
    return res.status(404).json({ message: "Account not found." });
  }
  return res.json({ message: "OTP verified. You can now set a new password.", email: user.email });
};

// ---------------- RESEND OTP ----------------
const HandleResendOtp = async (req, res) => {
  const { email, purpose } = req.body;
  if (!email || !purpose) {
    return res.status(400).json({ message: "Email and purpose are required." });
  }

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (purpose === "verify") {
    if (!user) return res.status(404).json({ message: "Account not found." });
    if (user.isVerified)
      return res.status(400).json({ message: "Email is already verified." });
  }

  const { dev } = await createAndSendOtp(email.trim().toLowerCase(), purpose);
  return res.json({ message: "A new code has been sent to your email.", dev });
};

// ---------------- FORGOT PASSWORD ----------------
const HandleForgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    // Do not reveal whether the account exists.
    return res
      .status(200)
      .json({ message: "If an account exists for that email, a reset code has been sent." });
  }
  if (!user.password) {
    return res
      .status(200)
      .json({ message: "This account uses Google sign-in. Please continue with Google." });
  }

  const { dev } = await createAndSendOtp(user.email, "reset");
  return res.status(200).json({
    message: "We just emailed you a reset code. It is valid for 10 minutes.",
    dev,
  });
};

// ---------------- RESET PASSWORD ----------------
const HandleResetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: "Email and new password are required." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }
  if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({
      message: "Password must contain at least one letter and one number.",
    });
  }

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) return res.status(404).json({ message: "Account not found." });
  if (!user.password)
    return res.status(400).json({ message: "This account uses Google sign-in." });

  user.password = newPassword;
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  return res.status(200).json({ message: "Password updated. You can now log in." });
};

// ---------------- CURRENT USER ----------------
const GetMe = async (req, res) => {
  const user = await UserModel.findById(req.user._id).select("-password -salt -__v");
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ user: publicUser(user) });
};

module.exports = {
  HandleLogin,
  HandleSignUp,
  HandleGoogleAuth,
  HandleVerifyOtp,
  HandleResendOtp,
  HandleForgotPassword,
  HandleResetPassword,
  GetMe,
};