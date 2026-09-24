const nodemailer = require("nodemailer");
const crypto = require("crypto");
const OtpModel = require("../model/otpModel");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

async function createAndSendOtp(email, purpose) {
  await OtpModel.deleteMany({ email, purpose });
  const otp = generateOtp();
  await OtpModel.create({ email, otp, purpose });

  const text =
    `Your ChatX verification code is ${otp}.\n\n` +
    `It is valid for 10 minutes. If you did not request this, you can safely ignore this email.`;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[DEV-MODE] OTP for ${email} (${purpose}): ${otp}`);
    return { dev: true };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "ChatX - Your verification code",
    text,
  });
  return { dev: false };
}

async function verifyOtpToken(email, otp, purpose) {
  const record = await OtpModel.findOne({ email, purpose });
  if (!record) throw new Error("No valid OTP found. Please request a new one.");
  if (record.expiresAt < Date.now()) throw new Error("This OTP has expired. Please request a new one.");
  if (record.otp !== otp) throw new Error("Invalid OTP. Please try again.");
  await OtpModel.deleteMany({ email, purpose });
  return true;
}

module.exports = { createAndSendOtp, verifyOtpToken, generateOtp };