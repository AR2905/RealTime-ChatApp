const express = require("express")
const {
  allMessages,
  searchMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  markMessagesRead,
} = require("../Controllers/MessageController")

const router = express.Router()

router.route("/").post(sendMessage)
router.route("/:chatId/read").put(markMessagesRead)
router.route("/:chatId/search").get(searchMessages)
router.route("/:chatId").get(allMessages)
router.route("/reaction/:messageId").post(addReaction)

router.route("/:messageId").put(editMessage)
router.route("/:messageId").delete(deleteMessage)

module.exports = router