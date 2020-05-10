const express = require("express");
const router = express.Router();
const userController = require("../controllers/users");
const CheckAuth = require("../middleware/check.auth");

/**
 * A patch route which update isSuperUser property of admin's document
 * Only admins can access this
 */
router.patch("/super-user/login", CheckAuth, userController.superUserLogin);
router.patch("/super-user/logout", CheckAuth, userController.superUserLogOut);

/**
 * Add users or admin
 * only superuser can add all type of users including admins
 * admins can add librarian, student and faculty
 * librarian can add student and faculty
 */
router.post("/add", CheckAuth, userController.addUserOrAdmin);

/**
 * Public Login route
 */
router.post("/login", userController.login);

//Admin can delete All, user and librarian can delete himself only
router.delete("/:userId", CheckAuth, userController.deleteById);

//Admins can see all detatils but librarian can see only card number, orders, email, department, year and name
router.get("/users", CheckAuth, userController.getAllUsers);

//user or admin can access own data only
router.get("/:userId", CheckAuth, userController.getById);

//Admins Only
router.get("/admins/all", CheckAuth, userController.getAllAdmins);

module.exports = router;
