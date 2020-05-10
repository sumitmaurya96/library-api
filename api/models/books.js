const mongoose = require("mongoose");

const bookSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    bookImage: {
      type: String,
      required: true,
    },
  },
  { collection: "books" }
);

module.exports = mongoose.model("Book", bookSchema);
