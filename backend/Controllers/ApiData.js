const UserModel = require("../model/UserModel");
const { VerifyToken } = require("../config/Token")

const GetCookieInfo = (req, res) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const userPayload = VerifyToken(token);
      localStorage.setItem('UserInformation', JSON.stringify(userPayload));
      res.json(userPayload);
      
    } catch (error) {
      console.error('Error verifying token:', error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  }

const GetAllUsers = async(req, res) =>{

    const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};
    const users =  await UserModel.find(keyword).find({_id : {
        $ne : req.user._id
    }})

    res.send(users)
}

  module.exports = {GetCookieInfo , GetAllUsers}