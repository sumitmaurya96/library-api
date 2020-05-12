const express = require("express");
const router = express.Router();
const userController = require("../../controllers/person/users");
const CheckAuth = require("../../middleware/check.auth");

/**
 * Add users
 * only admins can access
 * admins can add librarian, student and faculty
 * librarian can add student and faculty
 */
router.post("/add", CheckAuth, userController.addUser);

/**
 * Login route
 * It is the only public route
 */
router.post("/login", userController.loginUser);

/**
 * user can update itself
 * Admin can update all users
 * Librarian can update faculty, student
 */
router.patch("/:id", CheckAuth, userController.updateUser);

/**
 * user can delete itself
 * Admin can delete all users
 * Librarian can delete faculty, student
 */
router.delete("/:id", CheckAuth, userController.deleteUser);

//Admins
router.get("/users", CheckAuth, userController.getUsers);

/**
 * Get user By Id
 * every user can access his/her own record
 * admin can access anyone's record
 * librarian can access student and faculty record
 */
router.get("/:id", CheckAuth, userController.getUserById);

module.exports = router;
