const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { createHash } = require("crypto");

const { CreateToken } = require("../config/Token");

const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    salt: {
      type: String,
    },
    pic: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
    },
    online: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
    },
    blocked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ------------- Password hashing (bcrypt) -------------
UserSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password") || !user.password) return next();
  if (user.password.startsWith("$2")) return next();

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(user.password, salt);
  user.salt = undefined;
  next();
});

// ------------- Password matching with legacy sha256 migration -------------
UserSchema.statics.matchPassword = async function (email, enteredPassword) {
  const user = await this.findOne({ email });

  if (!user) {
    throw new Error("No account found with this email.");
  }

  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const minsLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    throw new Error(`Too many failed attempts. Account locked for ${minsLeft} minute(s).`);
  }

  if (!user.password && user.authProvider === "google") {
    throw new Error("This account uses Google sign-in. Please continue with Google.");
  }

  let isValid = false;

  if (user.password && user.password.startsWith("$2")) {
    isValid = await bcrypt.compare(enteredPassword, user.password);
  } else if (user.password && user.salt) {
    // Legacy SHA-256 hashes from the previous version
    const legacyHash = createHash("sha256")
      .update(enteredPassword + user.salt)
      .digest("hex");
    isValid = legacyHash === user.password;
    if (isValid) {
      user.password = enteredPassword;
      await user.save();
    }
  }

  if (!isValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    throw new Error("Invalid email or password.");
  }

  if (user.failedLoginAttempts || user.lockedUntil) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();
  }

  const token = CreateToken(user);
  return { token, user };
};

const UserModel = mongoose.model("users", UserSchema);

module.exports = UserModel;