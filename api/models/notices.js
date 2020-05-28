const mongoose = require("mongoose");

const noticeSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    title: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    date: {
      type: Date,
      default: new Date().toISOString(),
    },
  },
  { collection: "notices" }
);

module.exports = mongoose.model("Notice", noticeSchema);
