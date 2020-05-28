const mongoose = require("mongoose");

/**
 * user_id is username of borrower or issuer(librarian)
 */
const transactionSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: {
      type: String,
      unique: true,
      required: true,
    },
    bookTransactions: {
      type: Array,
      default: [],
    },
  },
  { collection: "transactions" }
);

module.exports = mongoose.model("Transaction", transactionSchema);
