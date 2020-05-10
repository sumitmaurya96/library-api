const express = require("express");
const router = express.Router();

const checkAuth = require("../middleware/check.auth");
const orderController = require("../controllers/orders");

router.get("/", checkAuth, orderController.get_all);

router.post("/", checkAuth, orderController.post);

router.get("/:orderId", checkAuth, orderController.get_by_id);

router.delete("/:orderId", checkAuth, orderController.delete);

module.exports = router;
