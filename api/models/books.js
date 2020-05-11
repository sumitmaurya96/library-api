const mongoose = require("mongoose");

const bookSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    isbn: {
      type: String,
      unique: true,
    },
    issn: {
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
    thumbnailUrl: {
      type: String,
      default: "http://localhost:5000/uploads/default-book-thumbnail.jpg",
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

bookSchema.path("isbn").required(() => {
  return !this.issn;
}, "one of isbn, issn is required");

bookSchema.path("issn").required(() => {
  return !this.isbn;
}, "one of isbn, issn is required");

module.exports = mongoose.model("Book", bookSchema);
