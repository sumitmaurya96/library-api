const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const checkAuth = require("../middleware/check.auth");
const bookController = require("../controllers/books");

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

//models
const Book = require("../models/books");

router.get("/", bookController.get_all);

router.post("/", checkAuth, upload.single("bookImage"), bookController.post);

router.get("/:bookId", bookController.get_by_id);

router.patch("/:bookId", checkAuth, bookController.patch);

router.delete("/:bookId", checkAuth, bookController.delete);

module.exports = router;
