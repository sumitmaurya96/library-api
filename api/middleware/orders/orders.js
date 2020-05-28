const { findOneOrder } = require("../../helpers/db-functions/orders");

/**
 * Get Card-Status
 */
exports.fetchOrderDetails = (req, res, next) => {
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (result) => {
    if (result) {
      res.orderData = result;
      next();
    } else {
      res.status(500).json({
        message: "Error fetching orders",
      });
    }
  };

  findOneOrder(errorCb, getResultCb, { username: res.userData.username });
};
