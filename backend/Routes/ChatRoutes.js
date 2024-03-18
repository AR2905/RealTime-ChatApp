const express = require("express") 
const {fetchChats,
    accessChats,
    createGroupChat,
    renameGroupChat,
    removeFromGroup,
    addToGroup}= require("../Controllers/ChatControllers")

const router  = express.Router()

router.get("/" , fetchChats)
router.post("/" , accessChats)
router.post("/group" , createGroupChat )
router.put("/rename" , renameGroupChat)
router.put("/removefromgroup" , removeFromGroup)
router.put("/addtogroup" , addToGroup)
  
module.exports = router