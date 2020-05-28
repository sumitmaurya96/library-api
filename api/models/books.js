const mongoose = require("mongoose");

const bookSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    isbn: {
      type: String,
      unique: true,
    },
    authors: {
      type: Array,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    classNo: {
      type: String,
      required: true,
    },
    bookNo: {
      type: String,
      required: true,
    },
    accessionNo: {
      type: String,
      required: true,
      unique: true,
    },
    categories: {
      type: Array,
      required: true,
    },
    dateOfPurchase: {
      type: Date,
    },
    edition: {
      type: String,
    },
    pageCount: {
      type: Number,
    },
    bookCount: {
      type: Number,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: "/uploads/book-thumbnails/default-book-thumbnail.png",
    },
    ebookUrl: {
      type: String,
    },
    publication: {
      type: String,
    },
    status: {
      type: String,
    },
    shortDescription: {
      type: String,
    },
    longDescription: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { collection: "books" }
);

module.exports = mongoose.model("Book", bookSchema);
