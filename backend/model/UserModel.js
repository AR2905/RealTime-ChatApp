const mongoose = require('mongoose');
const { createHash, randomBytes } = require("crypto");

const {CreateToken} = require("../config/Token")

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    salt:{
      type  : String
    },
    pic: {
        type: String,
        required: true, 
        default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
      },
}, { timestamps: true });

UserSchema.statics.matchPassword = async function(email, enteredPassword) {
    const user = await UserModel.findOne({ email });
    
    if (!user) {
        throw new Error("User not found for the provided email.");
    }

    const hashedPassword = createHash('sha256')
        .update(enteredPassword + user.salt)
        .digest("hex");

    if (hashedPassword !== user.password) {
        throw new Error("Incorrect credentials.");
    }

    const token = CreateToken(user);
    
    return {token, user};
};

UserSchema.pre("save", async function(next) {
    const user = this
    if (!user.isModified('password')) return next();

    const salt = randomBytes(16).toString("hex");

    const hashPass = createHash("sha256")
        .update(user.password + salt)
        .digest("hex");

    user.salt = salt;
    user.password = hashPass;

    next();
});

const UserModel = mongoose.model("users", UserSchema);

module.exports = UserModel;
