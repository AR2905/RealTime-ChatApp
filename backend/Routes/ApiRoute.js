const express = require("express")
const { GetCookieInfo, GetAllUsers, getUnreadCounts } = require("../Controllers/ApiData")
const { protect } = require("../Middlewares/ProtectMiddleware")

const router = express.Router()

router.get("/me", protect, GetCookieInfo)
router.get("/users/unread", protect, getUnreadCounts)
router.get("/users", protect, GetAllUsers)

module.exports = router