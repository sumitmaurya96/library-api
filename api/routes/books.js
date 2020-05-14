const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const checkAuth = require("../middleware/check.auth");
const authenticated = require("../middleware/authenticated");
const bookController = require("../controllers/books");

//Storage stretgy
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
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
 * Get books by any query
 * limits to 20 books per query for a perticular page
 * not authenticated users can't get ebooks link
 */
router.get("/search/:query", authenticated, bookController.getBooks);

/**
 * Only Librarian and admin can access
 */
router.post(
  "/",
  checkAuth,
  upload.single("bookImage"),
  bookController.addNewBook
);

/**
 * Get books by Id
 * not authenticated users can't get ebooks link
 */
router.get("/:id", authenticated, bookController.getBookById);

/**
 * Only Librarian and admin can access
 */
router.patch("/:bookId", checkAuth, bookController.updateBook);

/**
 * Only Librarian and admin can access
 */
router.delete("/:bookId", checkAuth, bookController.deleteBook);

module.exports = router;
