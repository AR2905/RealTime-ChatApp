const express = require("express")
const {
  HandleLogin, HandleSignUp, HandleGoogleAuth, HandleVerifyOtp,
  HandleResendOtp, HandleForgotPassword, HandleResetPassword, GetMe,
} = require("../Controllers/HandleAuth")
const {
  updateProfile, changePassword, blockUser, unblockUser, deleteAccount,
} = require("../Controllers/UserController")
const { protect } = require("../Middlewares/ProtectMiddleware")
const { authLimiter, otpLimiter } = require("../config/rateLimiters")
const router = express.Router()

router.post("/login", authLimiter, HandleLogin)
router.post("/signup", authLimiter, HandleSignUp)
router.post("/google", authLimiter, HandleGoogleAuth)
router.post("/verify-otp", otpLimiter, HandleVerifyOtp)
router.post("/resend-otp", otpLimiter, HandleResendOtp)
router.post("/forgot-password", authLimiter, HandleForgotPassword)
router.post("/reset-password", authLimiter, HandleResetPassword)
router.get("/me", protect, GetMe)

router.put("/profile", protect, updateProfile)
router.put("/password", protect, changePassword)
router.put("/block/:userId", protect, blockUser)
router.put("/unblock/:userId", protect, unblockUser)
router.delete("/account", protect, deleteAccount)

module.exports = router