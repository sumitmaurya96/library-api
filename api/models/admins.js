const mongoose = require("mongoose");

const adminSchema = mongoose.Schema(
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
      default: "admin",
    },
    isSuperUser: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "admins" }
);

module.exports = mongoose.model("Admin", adminSchema);
