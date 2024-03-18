
const UserModel = require("../model/UserModel") 
const HandleLogin = async(req , res) =>{

    try {
        const {email , password} = req.body

    if( !email || !password) {
        res.status(400)
        throw new Error("All fields required...")
        
        
    }

    const {token, user} = await UserModel.matchPassword(email, password);

    if(token){
        return res.cookie("token" , token).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            pic: user.pic,
            token:token
        })
    }


    } catch (error) {
        console.log("Error : " , error)

        return res.status(400).json({ message: "Incorrect Credentials...." });
    }
    
}

const HandleSignUp = async ( req , res) => {
    const {name, email , password , pic} = req.body

    if(!name || !email || !password) {
        res.status(400)
        throw new Error("All fields required...")
    }


    const ExistUser = await  UserModel.findOne({email})

    if(ExistUser) {
        return res.status(400).json({ message: "User already Exists" });
    }

    const user = await UserModel.create({
        name, email , password, pic
    })

    if(user) {
        res.status(200).json({    
            _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
        })
    }
    else {
        return res.status(400).json({ message: "Faild to create the user" });

    }

}

module.exports = {
    HandleLogin, HandleSignUp
}