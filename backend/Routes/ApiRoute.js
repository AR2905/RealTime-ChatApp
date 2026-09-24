const express = require("express") 
const { GetCookieInfo, GetAllUsers } = require("../Controllers/ApiData")
const { protect } = require("../Middlewares/ProtectMiddleware")

const router  = express.Router()

router.get("/cookie" , GetCookieInfo)

router.get("/users" , protect ,GetAllUsers)

  
module.exports = router