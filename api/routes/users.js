const express = require("express");
const router = express.Router();
const multer = require("multer");

const userController = require("../controllers/users");
const CheckAuth = require("../middleware/check.auth");
const { admin, librarian, student, faculty } = require("../roles/roles");

//Storage stretgy
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/profile-pictures");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  //reject a file
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

/**
 * Add users
 * only admins and librarian can access
 * admins can add librarian, student and faculty
 * librarian can add student and faculty
 */
router.post(
  "/add",
  CheckAuth([admin, librarian]),
  userController.addUserOrAdmin
);

/**
 * Login route
 * It is the only public route here
 */
router.post("/login", userController.loginUser);

/**
 * Get user By Id or username
 * only admin can access
 * username=<>
 * id=<>
 */
router.get(
  "/find-users/:query",
  CheckAuth([admin]),
  userController.getUserByUsernameOrId
);

/**
 * Get admins
 * req.body.key
 * admin can access other admin record with a key
 */
router.post("/admins", CheckAuth([admin]), userController.getAllAdmins);

/**
 * Get user By Id
 * every user can access his/her own record
 */
router.get(
  "/yourself",
  CheckAuth([admin, librarian, student, faculty]),
  userController.getYourSelf
);

/**
 * Admin can access this route
 * get all user data
 */
router.get("/", CheckAuth([admin]), userController.getAllUsers);

/**
 * users can update itself
 * Admin can update all users
 */
router.patch(
  "/:id",
  CheckAuth([admin, librarian, student, faculty]),
  upload.single("profilePic"),
  userController.updateUser
);

/**
 * users can update its favourites
 * delete=true to delete
 * body contains bookId
 */
router.patch(
  "/favourites/:query",
  CheckAuth([admin, student, faculty]),
  userController.updateFavourites
);

/**
 * users can delete itself
 * Admin can delete all users
 */
router.delete(
  "/:id",
  CheckAuth([admin, librarian, student, faculty]),
  userController.deleteUser
);

module.exports = router;
