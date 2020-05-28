const mongoose = require("mongoose");
const Transaction = require("../../models/transactions");

const saveTransaction = (transDetails) => {
  const { userId, bookTransactions } = transDetails;

  Transaction.findOne({ userId: transDetails.userId })
    .exec()
    .then((transaction) => {
      if (transaction) {
        const bookTransactionsInDB = [
          ...bookTransactions,
          ...transaction.bookTransactions,
        ];

        Transaction.updateOne(
          { userId: userId },
          { $set: { bookTransactions: bookTransactionsInDB } }
        )
          .exec()
          .then((result) => {
            console.log("transcation update success");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        const newTransaction = new Transaction({
          _id: mongoose.Types.ObjectId(),
          userId: userId,
          bookTransactions: bookTransactions,
        });
        newTransaction
          .save()
          .then((result) => {
            console.log("transcation creation success");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log("Error is saving transaction");
    });
};

module.exports = { saveTransaction };
