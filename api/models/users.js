const mongoose = require("mongoose");

/**
 * for student username is Card Number and for faculty or librarian splitted email string
 * useremail@mail.com -> useremail
 */

const userSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    firstname: {
      type: String,
      required: true,
      match: /^[a-z ]+$/i,
    },
    lastname: {
      type: String,
      required: true,
      match: /^[a-z ]+$/i,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      match: /^(?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "student",
    },
  },
  { collection: "users" }
);

module.exports = mongoose.model("User", userSchema);
