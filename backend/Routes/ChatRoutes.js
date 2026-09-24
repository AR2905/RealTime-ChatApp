const express = require("express")
const {
  fetchChats,
  accessChats,
  createGroupChat,
  renameGroupChat,
  updateGroupPic,
  removeFromGroup,
  addToGroup,
  deleteGroupChat,
  transferAdmin,
} = require("../Controllers/ChatControllers")

const router = express.Router()

router.get("/", fetchChats)
router.post("/", accessChats)
router.post("/group", createGroupChat)
router.put("/rename", renameGroupChat)
router.put("/grouppic", updateGroupPic)
router.put("/removefromgroup", removeFromGroup)
router.put("/addtogroup", addToGroup)
router.put("/transfer", transferAdmin)
router.delete("/group/:chatId", deleteGroupChat)

module.exports = router