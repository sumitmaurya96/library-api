const express = require("express");
const router = express.Router();
const multer = require("multer");
const checkAuth = require("../middleware/check.auth");
const checkIfUserLoggedIn = require("../middleware/check.user.loggedin");
const bookController = require("../controllers/books");
const { admin, librarian } = require("../roles/roles");

//Storage stretgy
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "ebook") {
      cb(null, "./uploads/ebooks");
    } else {
      cb(null, "./uploads/thumbnails");
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  //reject a file
  if (file.fieldname === "ebook") {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } else {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 10,
  },
  fileFilter: fileFilter,
});

/**
 * Get books by any query
 * limits to 20 books per query for a perticular page
 * not authenticated users can't get ebooks link
 */
router.get(
  "/text-search/:query",
  checkIfUserLoggedIn,
  bookController.getBooksByTextQuery
);

/**
 * Get books by any query
 * limits to 20 books per query for a perticular page
 * not authenticated users can't get ebooks link
 */
router.get(
  "/custom-search/:query",
  checkIfUserLoggedIn,
  bookController.getBooksByCustomQuery
);

/**
 * Get books by Id
 * not authenticated users can't get ebooks link
 */
router.get("/:bookId", checkIfUserLoggedIn, bookController.getBookById);

/**
 * Get all books
 * not authenticated users can't get ebooks link
 */
router.get("/", checkIfUserLoggedIn, bookController.getBooks);

/**
 * Only Librarian and admin can access
 */
router.post(
  "/",
  checkAuth([admin, librarian]),
  upload.fields([
    { name: "ebook", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  bookController.addNewBook
);

/**
 * Only Librarian and admin can access
 */
router.patch(
  "/:bookId",
  checkAuth([admin, librarian]),
  upload.fields([
    { name: "ebook", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  bookController.updateBook
);

/**
 * Only Librarian and admin can access
 */
router.delete(
  "/:bookId",
  checkAuth([admin, librarian]),
  bookController.deleteBook
);

module.exports = router;
