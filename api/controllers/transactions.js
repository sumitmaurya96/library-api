const Transaction = require("../models/transactions");

exports.getTransactionById = (req, res, next) => {
  Transaction.findById(req.params.transactionId)
    .populate("book")
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).json({
        from: "GET /transactions/:transactionId",
        error: err,
      });
    });
};

exports.getTransactionsByDate = (req, res, next) => {
  Transaction.find()
    .select("book quantity id")
    .populate("book", "_id name price")
    .exec()
    .then((result) => {
      res.status(200).json({
        count: result.length,
        transactions: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        from: "GET /transactions",
        error: err,
      });
    });
};
