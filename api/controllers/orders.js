//Roles
const { admin, librarian } = require("../roles/roles");

const {
  findOneOrder,
  updateOneOrder,
  findAllOrders,
} = require("../helpers/db-functions/orders");

const Book = require("../models/books");

/**
 * PATCH
 * req.body contains one bookId
 * Add new order
 * this is actually a patch route which updates orders property of document order
 */
exports.addOneBookInCart = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const addedOrderCb = (result) => {
    if (result) {
      res.status(409).json({
        message: "secceed",
      });
    } else {
      res.status(501).json({
        message: "Order creation not succedded",
      });
    }
  };

  const currentOrder = {
    granted: false,
    borrowDate: new Date().toISOString(),
    submissionDate: new Date().toISOString(),
    bookId: req.body.bookId,
  };

  if (res.orderData.borrowLimit > res.orderData.orders.length) {
    updateOneOrder(
      errorCb,
      addedOrderCb,
      { _id: res.orderData.id },
      { $push: { orders: currentOrder } }
    );
  } else {
    res.status(400).json({
      message: "Borrow limit reached",
    });
  }
};

/**
 * PATCH
 * req.body contains one orderId
 * user can delete its order which is not granted by librarian till now
 * if librarian granted(completed) an order then user can't delete it
 */
exports.removeOneBookFromCart = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (result) => {
    if (result) {
      if (result.nModified) {
        res.status(200).json({
          message: "Order Deleted",
        });
      } else {
        res.status(403).json({
          message: "Not Deleted",
        });
      }
    }
  };

  updateOneOrder(
    errorCb,
    getResultCb,
    { _id: res.orderData.id },
    { $pull: { orders: { _id: req.params.orderId } } },
    false,
    true
  );
};

/**
 * PATCH
 * librarian grant an order
 */
exports.issueOneBook = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (borrower) => {
    console.log(borrower);

    if (borrower) {
      const orderIndex = [...borrower.orders].findIndex((order) => {
        return order.id === req.body.orderId;
      });
      console.log(orderIndex);
      const bookId = borrower.orders[orderIndex].bookId;

      Book.findOne({ _id: bookId })
        .exec()
        .then((book) => {
          if (book) {
            if (book.bookCount > 0) {
              const updatedOrderCb = (result) => {
                if (result.nModified) {
                  Book.updateOne(
                    { _id: bookId },
                    { $set: { bookCount: book.bookCount - 1 } }
                  )
                    .exec()
                    .then((updatedBook) => {
                      res.status(200).json({
                        message: "Done",
                      });
                    })
                    .catch((err) => {
                      res.status(403).json({
                        message: "Book count not updated",
                      });
                    });
                } else {
                  res.status(501).json({
                    message: "Not succedded",
                  });
                }
              };

              const updateOps = {};
              updateOps["$set"] = {};
              updateOps["$set"][`orders.${orderIndex}.granted`] = true;
              console.log(updateOps);

              console.log(borrower);

              if (borrower.borrowLimit > borrower.orders.length) {
                updateOneOrder(
                  errorCb,
                  updatedOrderCb,
                  { _id: borrower.id },
                  updateOps
                );
              } else {
                res.status(400).json({
                  message: "Borrow limit reached",
                });
              }
            } else {
              res.status(404).json({
                message: "Book not avilable",
              });
            }
          } else {
            res.status(404).json({
              message: "Book not found",
            });
          }
        })
        .catch((err) => {
          res.status(403).json({
            message: "Book not found",
          });
        });
    } else {
      res.status(404).json({
        message: "Borrower not found",
      });
    }
  };

  findOneOrder(errorCb, getResultCb, { username: req.params.borrowerId });
};

/**
 * PATCH
 * user return an order to librarian
 */
exports.returnOneBook = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (borrower) => {
    if (borrower) {
      const orderIndex = [...borrower.orders].findIndex((order) => {
        return order.id === req.body.orderId;
      });
      const bookId = borrower.orders[orderIndex].bookId;
      Book.findOne({ _id: bookId })
        .exec()
        .then((book) => {
          if (book) {
            if (book.bookCount > 0) {
              const updatedOrderCb = (result) => {
                if (result.nModified) {
                  Book.updateOne(
                    { _id: bookId },
                    { $set: { bookCount: book.bookCount + 1 } }
                  )
                    .exec()
                    .then((updatedBook) => {
                      res.status(200).json({
                        message: "Done",
                      });
                    })
                    .catch((err) => {
                      res.status(403).json({
                        message: "Book count not updated",
                      });
                    });
                } else {
                  res.status(501).json({
                    message: "Not succedded",
                  });
                }
              };

              const oneDayDueCharge = 0.3;

              let dueAmount = 0;

              const amount =
                ((new Date().getTime() -
                  borrower.orders[orderIndex].submissionDate) *
                  oneDayDueCharge) /
                (1000 * 60 * 60 * 24);

              dueAmount += amount > 0 ? amount : 0;

              const updateProps = {};
              updateProps["dueAmount"] = dueAmount;
              updateProps[`orders.${orderIndex}.granted`] = false;

              if (borrower.orders.length < borrower.borrowLimit) {
                updateOneOrder(
                  errorCb,
                  updatedOrderCb,
                  { _id: borrower.id },
                  {
                    $set: updateProps,
                  }
                );
              } else {
                res.status(400).json({
                  message: "Borrow limit reached",
                });
              }
            } else {
              res.status(404).json({
                message: "Book not avilable",
              });
            }
          } else {
            res.status(404).json({
              message: "Book not found",
            });
          }
        })
        .catch((err) => {
          errorCb(err);
        });
    } else {
      res.status(404).json({
        message: "Borrower not found",
      });
    }
  };

  findOneOrder(errorCb, getResultCb, {
    username: req.params.borrowerId,
  });
};

/**
 * GET
 * librarian get an user order
 */
exports.getOrderOfUser = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (result) => {
    if (result) {
      res.status(200).json({
        order: result,
      });
    } else {
      res.status(404).json({
        message: "Not found",
      });
    }
  };

  if (res.userData.role === librarian || res.userData.role === admin) {
    findOneOrder(errorCb, getResultCb, { username: req.params.borrowerId });
  } else {
    findOneOrder(errorCb, getResultCb, { username: req.params.borrowerId });
  }
};

/**
 * GET
 * Librarian and admin only
 */
exports.getAllOrders = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (results) => {
    res.status(200).json({
      count: results.length,
      orders: results,
    });
  };
  findAllOrders(errorCb, getResultCb);
};
