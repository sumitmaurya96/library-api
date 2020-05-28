const mongoose = require("mongoose");

const feedbackSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    feedback: [
      {
        type: String,
      },
    ],
    date: {
      type: Date,
      default: new Date().toISOString(),
    },
  },
  { collection: "feedbacks" }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
