const express = require("express") 
const {
    HandleLogin, HandleSignUp
} = require("../Controllers/HandleAuth")
const router  = express.Router()

router.post("/login" , HandleLogin)

router.post("/signup", HandleSignUp )
module.exports = router