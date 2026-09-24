const mongoose = require("mongoose");

const ReactionSchema = mongoose.Schema(
  {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

ReactionSchema.index({ message: 1, user: 1, emoji: 1 }, { unique: true });

const ReactionModel = mongoose.model("reactions", ReactionSchema);

module.exports = ReactionModel;