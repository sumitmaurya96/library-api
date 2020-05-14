const queryString = require("query-string");
//models
const Book = require("../models/books");
//Roles
const { admin, librarian, faculty, student } = require("../roles-config/roles");

/**
 * Unregistered users can not get ebook link
 */
exports.getBooks = (req, res, next) => {
  const queryObj = queryString.parse("?" + req.params.query, {
    parseNumbers: true,
    parseBooleans: true,
  });

  let query = queryObj.query ? `${queryObj.query}` : "book";
  query = queryObj.exact ? `\"${query}\"` : query;
  query = queryObj.excludes ? `${query}-${excludes}` : query;

  const pageSize =
    queryObj.pageSize && queryObj.pageSize > 0 && queryObj.pageSize <= 30
      ? queryObj.pageSize
      : 30;

  const pageNumber =
    queryObj.pageNumber && queryObj.pageNumber > 0 ? queryObj.pageNumber : 1;

  const limit =
    queryObj.limit && queryObj.limit > 0 && queryObj.limit <= pageSize
      ? queryObj.limit
      : pageSize;

  // console.log("pageSize: " + pageSize);
  // console.log("pageNumber: " + pageNumber);
  // console.log("Limit: " + limit);
  // console.log("Query: " + query);

  const findResultCb = (totalMachedItems) => {
    Book.find({ $text: { $search: query } }, { $score: { $meta: "textScore" } })
      .sort({ $score: { $meta: "textScore" } })
      .skip((pageNumber - 1) * pageSize)
      .limit(limit)
      .exec()
      .then((results) => {
        if (!results.length) {
          res.status(404).json({
            message: "Not found",
          });
        } else {
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
        }
      })
      .catch((err) => {
        res.status(500).json({
          message: "from GET /books",
          error: err,
        });
      });
  };

  Book.find(
    { $text: { $search: query } },
    { $score: { $meta: "textScore" } }
  ).countDocuments((err, count) => {
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
  const defaultThumbnailUrl =
    "https://localhost:5000/uploads/1588577122171-the-arsonist.jpg";
  console.log(req.file);
  if (res.userData.role === admin.id && res.userData.role === librarian.id) {
    const bookOps = {};
    for (const ops in req.body) {
      bookOps[ops] = req.body[ops];
    }

    bookOps["thumbnailUrl"] =
      req.file && req.file.path ? req.file.path : defaultThumbnailUrl;

    const book = new Book({
      _id: new mongoose.Types.ObjectId(),
      ...bookOps,
    });

    book
      .save()
      .then((result) => {
        console.log(result);
        res.status(201).json({
          message: "handling POST request to /books",
          creactedBook: book,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ from: "POST/books", error: err });
      });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * only logged-in user can access Ebook Link
 */
exports.getBookById = (req, res, next) => {
  const id = req.params.bookId;
  Book.findById(id)
    .exec()
    .then((result) => {
      console.log(result);
      if (result) {
        res.status(404).json({
          message: "Not found",
        });
      } else {
        const { ebookUrl, ...bookWithoutEbookLink } = result;
        const book = res.userData ? result : bookWithoutEbookLink;
        res.status(200).json({
          ...book,
        });
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
  const defaultThumbnailUrl =
    "https://localhost:5000/uploads/1588577122171-the-arsonist.jpg";
  if (res.userData.role === admin.id && res.userData.role === librarian.id) {
    //this method expect req.body to be an array
    const id = req.params.bookId;
    const updateOps = {};

    for (const ops of req.body) {
      if (ops.propName !== "_id") updateOps[ops.propName] = ops.propValue;
    }
    bookOps["thumbnailUrl"] =
      req.file && req.file.path ? req.file.path : defaultThumbnailUrl;

    Book.updateOne({ _id: id }, { $set: { ...updateOps } })
      .exec()
      .then((result) => {
        console.log(result);
        res.status(200).json(result);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          from: "UPDATE /book/:id",
          error: err,
        });
      });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * Only Admin and Librarian can update book details
 */
exports.deleteBook = (req, res, next) => {
  if (res.userData.role === admin.id && res.userData.role === librarian.id) {
    const id = req.params.bookId;
    Book.deleteOne({ _id: id })
      .exec()
      .then((result) => {
        console.log(result);
        //If result.deletedCount is 0, no data matches with that id
        if (result.deletedCount) {
          res.status(200).json(result);
        } else {
          res.status(404).json({
            message: "Not found",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ from: "DELETE/books/:id", error: err });
      });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};
