const mongoose = require("mongoose");

//Schema
const Order = require("../../models/orders");

const findOneOrder = (errorCb, getResultCb, query) => {
  Order.findOne(query)
    .exec()
    .then((result) => {
      getResultCb(result);
    })
    .catch((err) => {
      errorCb(err);
    });
};

const findAllOrders = (errorCb, getResultsCb) => {
  Order.find()
    .exec()
    .then((results) => {
      getResultsCb(results);
    })
    .catch((err) => {
      errorCb(err);
    });
};

const addOneOrder = (req, res, user) => {
  const order = new Order({
    _id: mongoose.Types.ObjectId(),
    username: user.username,
    borrowLimit: user.borrowLimit,
    orders: [],
  });

  order
    .save()
    .then((result) => {
      res.status(201).json({
        message: "User and order bucket created",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "User created but order bucket creation faild",
        error: err,
      });
    });
};

const updateOneOrder = (errorCb, getResultCb, query, updateProps) => {
  Order.updateOne(query, updateProps)
    .exec()
    .then((result) => {
      getResultCb(result);
    })
    .catch((err) => {
      errorCb(err);
    });
};

const deleteOneOrder = (req, res, query) => {
  Order.deleteOne(query)
    .exec()
    .then((result) => {
      if (result.deletedCount) {
        res.status(200).json({
          message: "User and order deleted",
        });
      } else {
        res.status(300).json({
          message: "User deleted but order bucket not deleted 1",
        });
      }
    })
    .catch((err) => {
      res.status(300).json({
        message: "User deleted but order bucket not deleted 2",
        error: err,
      });
    });
};

module.exports = {
  findOneOrder,
  findAllOrders,
  addOneOrder,
  updateOneOrder,
  deleteOneOrder,
};
