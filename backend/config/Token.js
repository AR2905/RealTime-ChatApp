require('dotenv').config();

const JWT = require("jsonwebtoken")

const secret =process.env.JWT_SEC

const CreateToken =  (user) => {
    
    const payload = {
        _id : user._id , 
        name : user.name,
        email : user.email,
        pic : user.pic
    }

    const token = JWT.sign(payload, secret)

    return token
}

const VerifyToken = (token) =>{ 
    const payload = JWT.verify(token , secret) ; 
    return payload
}

module.exports = {
    CreateToken, VerifyToken
}