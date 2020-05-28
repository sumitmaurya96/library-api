const mongoose = require("mongoose");
const fs = require("fs");
const qs = require("qs");

//models
const Book = require("../models/books");

const { contains } = require("../helpers/algorithms");
/**
 * Books By Catagories
 * Unregistered users can not get ebook link
 */
exports.getBooksByCustomQuery = (req, res, next) => {
  const queryObj = qs.parse(req.params.query, {
    ignoreQueryPrefix: true,
  });
  //console.log(queryObj);

  const {
    isbn,
    accessionNo,
    pageNumber,
    pageSize,
    limit,
    ...nonUniqueQuery
  } = queryObj;

  let query = null;

  if (isbn) {
    query = {};
    query["isbn"] = isbn;
  } else if (accessionNo) {
    query = {};
    query["accessionNo"] = accessionNo;
  } else {
    if (Object.keys(nonUniqueQuery).length !== 0) {
      query = {};
      query = { ...nonUniqueQuery };
    }
  }

  let pn, ps, lt;
  if (pageNumber) {
    pn = parseInt(pageNumber);
    if (`${pn}` === "NaN") {
      pn = -1;
    }
  }

  if (pageSize) {
    ps = parseInt(pageSize);
    if (`${ps}` === "NaN") {
      ps = -1;
    }
  }
  if (limit) {
    lt = parseInt(limit);
    if (`${lt}` === "NaN") {
      lt = -1;
    }
  }

  const getPageSize = ps > 0 && ps <= 30 ? ps : 30;
  const getPageNumber = pn > 0 ? pn : 1;
  const getLimit = lt > 0 && lt <= ps ? lt : getPageSize;

  console.log("pageSize: " + getPageSize);
  console.log("pageNumber: " + getPageNumber);
  console.log("Limit: " + getLimit);
  console.log("Query: " + query);

  const findResultCb = (totalMachedItems) => {
    Book.find(query)
      .skip((getPageNumber - 1) * getPageSize)
      .limit(getLimit)
      .exec()
      .then((results) => {
        res.status(200).json({
          total: totalMachedItems,
          count: results.length,
          books: results.map((result) => {
            const { ebookUrl, ...bookWithoutEbookLink } = result._doc;
            const book = res.userData ? result._doc : bookWithoutEbookLink;
            return {
              book: book,
              request: {
                type: "GET",
                url: `http://localhost:5000/books/${book._id}`,
              },
            };
          }),
        });
      })
      .catch((err) => {
        console.log("afbka");
        res.status(500).json({
          message: "from GET /books",
          error: err,
        });
      });
  };

  Book.countDocuments((err, count) => {
    if (!err) {
      findResultCb(count);
    } else {
      res.status(500).json({
        error: err,
      });
    }
  });
};

/**
 * Get all Books
 * Unregistered users can not get ebook link
 */
exports.getBooks = (req, res, next) => {
  Book.find()
    .exec()
    .then((results) => {
      res.status(200).json({
        count: results.length,
        books: results.map((result) => {
          const { ebookUrl, ...bookWithoutEbookLink } = result._doc;
          console.log(res.userData);
          const book = res.userData ? result._doc : bookWithoutEbookLink;
          return {
            book: book,
            request: {
              type: "GET",
              url: `http://localhost:5000/books/${book._id}`,
            },
          };
        }),
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "from GET /books",
        error: err,
      });
    });
};

/**
 * Books By Catagories
 * Unregistered users can not get ebook link
 */
exports.getBooksByTextQuery = (req, res, next) => {
  const queryObj = qs.parse(req.params.query, {
    ignoreQueryPrefix: true,
  });

  let pn, ps, lt;
  if (queryObj.pageNumber) {
    pn = parseInt(queryObj.pageNumber);
    if (`${pn}` === "NaN") {
      pn = -1;
    }
  }

  if (queryObj.pageSize) {
    ps = parseInt(queryObj.pageSize);
    if (`${ps}` === "NaN") {
      ps = -1;
    }
  }
  if (queryObj.limit) {
    lt = parseInt(queryObj.limit);
    console.log(`${lt}` === "NaN");
    if (`${lt}` === "NaN") {
      lt = -1;
    }
  }

  const pageSize = ps > 0 && ps <= 30 ? ps : 30;
  const pageNumber = pn > 0 ? pn : 1;
  const limit = lt > 0 && lt <= ps ? lt : pageSize;

  console.log("pageSize: " + pageSize);
  console.log("pageNumber: " + pageNumber);
  console.log("Limit: " + limit);

  let query = queryObj.query ? `${queryObj.query}` : "books";
  console.log("Query: " + query);

  query = queryObj.exact === "true" ? `\"${query}\"` : query;
  query = queryObj.excludes ? `${query}-${queryObj.excludes}` : query;

  const findResultCb = (totalMachedItems) => {
    Book.find({ $text: { $search: query } }, { $score: { $meta: "textScore" } })
      .sort({ $score: { $meta: "textScore" } })
      .skip((pageNumber - 1) * pageSize)
      .limit(limit)
      .exec()
      .then((results) => {
        res.status(200).json({
          total: totalMachedItems,
          count: results.length,
          books: results.map((result) => {
            const { ebookUrl, ...bookWithoutEbookLink } = result._doc;
            const book = res.userData ? result._doc : bookWithoutEbookLink;
            return {
              book: book,
              request: {
                type: "GET",
                url: `http://localhost:5000/books/${book._id}`,
              },
            };
          }),
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: "from GET /books",
          error: err,
        });
      });
  };

  Book.find({ $text: { $search: query } }).countDocuments((err, count) => {
    if (!err) {
      findResultCb(count);
    } else {
      res.status(500).json({
        error: err,
      });
    }
  });
};

/**
 * New book creation
 * Only Admin and Librarian can add new book
 */
exports.addNewBook = (req, res, next) => {
  const validBookProps = [
    "categories",
    "authors",
    "title",
    "dateOfPurchase",
    "edition",
    "pageCount",
    "bookCount",
    "publication",
    "status",
    "shortDescription",
    "longDescription",
    "price",
    "isbn",
    "bookNo",
    "classNo",
    "accessionNo",
  ];

  const bookOps = {};
  for (const ops in req.body) {
    if (contains.call(validBookProps, ops)) bookOps[ops] = req.body[ops];
  }

  console.log(req.files);

  let imageFile, ebookFile;
  if (req.files) {
    if (req.files.thumbnail) {
      imageFile = req.files["thumbnail"][0];
      bookOps["thumbnailUrl"] = imageFile.path;
    }

    if (req.files.ebook) {
      ebookFile = req.files["ebook"][0];
      bookOps["ebookUrl"] = ebookFile.path;
    }
  }

  console.log(req.body);
  console.log(res.userData);

  const book = new Book({
    _id: new mongoose.Types.ObjectId(),
    ...bookOps,
  });

  book
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Book created",
      });
    })
    .catch((err) => {
      console.log("hjhj");

      res.status(500).json({ from: "POST/books", error: err });

      if (imageFile) {
        fs.unlink(`./uploads/thumbnails/${imageFile.filename}`, (err) => {
          if (err) {
            console.log("failed to delete image:" + err);
          } else {
            console.log("successfully deleted image");
          }
        });
      }

      if (ebookFile) {
        fs.unlink(`./uploads/ebooks/${ebookFile.filename}`, (err) => {
          if (err) {
            console.log("failed to delete pdf:" + err);
          } else {
            console.log("successfully deleted pdf");
          }
        });
      }
    });
};

/**
 * only logged-in user can access Ebook Link
 */
exports.getBookById = (req, res, next) => {
  Book.findOne({ _id: req.params.bookId })
    .exec()
    .then((result) => {
      console.log(result);
      if (!result) {
        res.status(404).json({
          message: "Not found",
        });
      } else {
        const { ebookUrl, ...bookWithoutEbookLink } = result._doc;
        const book = res.userData ? result : bookWithoutEbookLink;
        res.status(200).json(book);
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ from: "GET/books/:id", error: err });
    });
};

/**
 * Only Admin and Librarian can update book details
 */
exports.updateBook = (req, res, next) => {
  const validUpdateProps = [
    "categories",
    "authors",
    "title",
    "dateOfPurchase",
    "edition",
    "pageCount",
    "bookCount",
    "publication",
    "status",
    "shortDescription",
    "longDescription",
    "price",
  ];

  const updateOps = {};

  console.log(req.body);
  console.log(req.files);

  for (const ops in req.body) {
    console.log(updateOps);
    if (contains.call(validUpdateProps, ops)) updateOps[ops] = req.body[ops];
  }

  if (req.files.thumbnail) {
    updateOps["thumbnailUrl"] = req.files["thumbnail"][0].path;
  }
  if (req.files.ebook) {
    updateOps["ebookUrl"] = req.files["ebook"][0].path;
  }

  console.log("update ops " + updateOps);

  Book.findOne({ _id: req.params.bookId })
    .exec()
    .then((book) => {
      if (book) {
        Book.updateOne({ _id: req.params.bookId }, { $set: { ...updateOps } })
          .exec()
          .then((result) => {
            console.log(result);
            if (result.nModified) {
              res.status(200).json({
                message: "Update successfull",
              });

              if (book.thumbnailUrl && updateOps.thumbnailUrl) {
                fs.unlink(book.thumbnailUrl, (err) => {
                  if (err) {
                    console.log("failed to delete image:" + err);
                  } else {
                    console.log("successfully deleted image");
                  }
                });
              }

              if (book.ebookUrl && updateOps.ebookUrl) {
                fs.unlink(book.ebookUrl, (err) => {
                  if (err) {
                    console.log("failed to delete pdf:" + err);
                  } else {
                    console.log("successfully deleted pdf");
                  }
                });
              }
            } else {
              res.status(200).json({
                message: "Update Unsuccessfull",
              });
            }
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              from: "UPDATE /book/:id",
              error: err,
            });
          });
      } else {
        res.status(404).json({ from: "UPDATE /books/:id" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        from: "UPDATE /books/:id",
        error: err,
      });
    });
};

/**
 * Only Admin and Librarian can update book details
 */
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.bookId })
    .exec()
    .then((book) => {
      if (book) {
        Book.deleteOne({ _id: req.params.bookId })
          .exec()
          .then((result) => {
            console.log(result);
            if (result.deletedCount) {
              res.status(200).json(result);

              if (book.thumbnailUrl) {
                fs.unlink(book.thumbnailUrl, (err) => {
                  if (err) {
                    console.log("failed to delete image:" + err);
                  } else {
                    console.log("successfully deleted image");
                  }
                });
              }

              if (book.ebookUrl) {
                fs.unlink(book.ebookUrl, (err) => {
                  if (err) {
                    console.log("failed to delete pdf:" + err);
                  } else {
                    console.log("successfully deleted pdf");
                  }
                });
              }
            } else {
              res.status(403).json({
                message: "Not deleted",
              });
            }
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({ from: "DELETE/books/:id", error: err });
          });
      } else {
        res.status(404).json({ from: "DELETE/books/:id" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        from: "DELETE/books/:id",
        error: err,
      });
    });
};
