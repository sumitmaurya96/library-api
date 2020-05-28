const mongoose = require("mongoose");

/**
 * transaction_code ("borrowed" or "returned")
 */

const orderSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    username: {
      type: String,
      required: true,
      unique: true,
    },
    borrowLimit: {
      type: Number,
      default: 6,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    orders: [
      {
        granted: {
          type: Boolean,
          default: false,
        },
        borrowDate: {
          type: Date,
          default: new Date().toISOString(),
        },
        submissionDate: {
          type: Date,
          default: new Date().toISOString(),
        },
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
      },
    ],
  },
  { collection: "orders" }
);

module.exports = mongoose.model("Order", orderSchema);
