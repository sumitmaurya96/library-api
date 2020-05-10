const Order = require("../models/orders");
const Book = require("../models/books");

exports.get_all = (req, res, next) => {
  Order.find()
    .select("book quantity id")
    .populate("book", "_id name price")
    .exec()
    .then((result) => {
      res.status(200).json({
        count: result.length,
        orders: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        from: "GET /orders",
        error: err,
      });
    });
};

exports.post = (req, res, next) => {
  Book.findById(req.body.bookId)
    .then((book) => {
      if (!book) {
        return res.status(404).json({
          message: "Book not found",
        });
      }
      const order = new Order({
        _id: mongoose.Types.ObjectId(),
        book: req.body.bookId,
        quantity: req.body.quantity,
      });

      return order.save();
    })
    .then((result) => {
      res.status(201).json({
        orderPlaced: true,
        orderDetails: {
          id: result._id,
          book: result.book,
          quantity: result.quantity,
        },
      });
    })
    .catch((err) => {
      res.status(500).json({
        from: "POST /orders",
        message: "Book not found",
        error: err,
      });
    });
};

exports.get_by_id = (req, res, next) => {
  Order.findById(req.params.orderId)
    .populate("book")
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).json({
        from: "GET /orders/:orderId",
        error: err,
      });
    });
};

exports.delete = (req, res, next) => {
  Order.deleteOne({ _id: req.params.orderId })
    .exec()
    .then((result) => {
      if (!result.deletedCount) {
        return res.status(404).json({
          message: "Order not found",
        });
      }
      res.status(200).json({
        status: true,
        message: "order deleted",
      });
    })
    .catch((err) => {
      res.status(500).json({
        from: "GET /orders/:orderId",
        error: err,
      });
    });
};
