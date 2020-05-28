const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orders");
const CheckAuth = require("../middleware/check.auth");
const { fetchOrderDetails } = require("../middleware/orders/orders");
const { admin, librarian, student, faculty } = require("../roles/roles");

/**
 * Add new order
 * student, faculty can add new orders to his/her cart
 */
router.patch(
  "/add",
  CheckAuth([student, faculty, admin]),
  fetchOrderDetails,
  orderController.addOneBookInCart
);

/**
 * users can delete its own order
 */
router.patch(
  "/remove/:orderId",
  CheckAuth([student, faculty]),
  fetchOrderDetails,
  orderController.removeOneBookFromCart
);

/**
 * Place new order
 * only admins and librarian can approve orders of user to be placed
 */
router.patch(
  "/issue-book/:borrowerId",
  CheckAuth([admin, librarian]),
  orderController.issueOneBook
);

/**
 * return order
 * only admins and librarian can return orders of user
 */
router.patch(
  "/return-book/:borrowerId",
  CheckAuth([admin, librarian]),
  orderController.returnOneBook
);

/**
 * Get order
 * anyone can get its own order
 * admin , librarian can get any user (student, faculty) order
 */
router.get(
  "/:borrowerId",
  CheckAuth([admin, librarian, faculty, student]),
  orderController.getOrderOfUser
);

/**
 * Get  all orders
 * admin , librarian can get all orders
 */
router.get("/", CheckAuth([admin, librarian]), orderController.getAllOrders);

module.exports = router;
