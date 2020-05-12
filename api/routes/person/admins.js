const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/person/admins");
const CheckAuth = require("../../middleware/check.auth");

/**
 * A patch route which update isSuperUser property of admin's document
 * Only admins can access this
 */
//Login
router.patch("/super-user/login", CheckAuth, adminController.superUserLogin);
//Logout
router.patch("/super-user/logout", CheckAuth, adminController.superUserLogOut);

/**
 * Add admin
 * only superuser can add admins
 */
router.post("/add", CheckAuth, adminController.addAdmin);

/**
 * Login route
 * It is the only public route
 */
router.post("/login", adminController.loginAdmin);

/**
 * admins can update itself
 * superuser can update all admins
 */
router.patch("/:id", CheckAuth, adminController.updateAdmin);

/**
 * admins can delete itself
 * superuser can delete all admins
 */
router.delete("/:id", CheckAuth, adminController.deleteAdmin);

/**
 * Get Admin by Id
 * admins can access his/her own record
 * superuser can access anyone's record
 */
router.get("/:id", CheckAuth, adminController.getAdminById);

/**
 * Get Admins by a custom Query
 * only superuser can access
 */
router.get("/search/:query", CheckAuth, adminController.getAdmins);

module.exports = router;
