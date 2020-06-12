const express = require("express");
const router = express.Router();

const checkAuth = require("../middleware/check.auth");
const transactionController = require("../controllers/transactions");

const { admin, librarian } = require("../roles/roles");

/**
 * Get all Transaction from a specific date to a specific date
 * Query parameters
 ** fromDate=<date>
 ** toDate=<date>
 */
router.get(
  "/query/:query",
  checkAuth([admin]),
  transactionController.getTransactionsByDate
);

/**
 * Get By UserId or transId
 * Query Parameters
 ** transId=<trans Id>
 ** userId=<user Id>
 */
router.get(
  "/id/:query",
  checkAuth([admin, librarian]),
  transactionController.getTransactionById
);

module.exports = router;
