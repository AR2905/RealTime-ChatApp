require('dotenv').config();

const JWT = require("jsonwebtoken")

const secret = process.env.JWT_SEC || "change-me-in-production"
const expiresIn = process.env.JWT_EXPIRY || "7d"

const CreateToken = (user) => {
  const payload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    pic: user.pic,
    isAdmin: user.isAdmin,
  }
  const token = JWT.sign(payload, secret, { expiresIn })
  return token
}

const VerifyToken = (token) => {
  const payload = JWT.verify(token, secret)
  return payload
}

module.exports = {
  CreateToken, VerifyToken
}