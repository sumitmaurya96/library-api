//models
const Book = require("../models/books");

/**
 * Unregistered users can not get ebook link
 */
exports.get_all = (req, res, next) => {
  Book.find()
    .exec()
    .then((results) => {
      if (!results.length) {
        res.status(404).json({
          message: "Not found",
        });
      } else {
        res.status(200).json({
          count: results.length,
          books: results.map((result) => {
            console.log(result);
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

/**
 * New book creation
 * Only Admin and Librarian can add new book
 */
exports.post = (req, res, next) => {
  console.log(req.file);
  if (
    res.userData.roles &&
    res.userData.roles.find((role) => {
      return role === "admin" || role === "librarian";
    })
  ) {
    const bookOps = {};
    for (const ops in req.body) {
      if (ops === "thumbnailUrl") {
        bookOps.thumbnailUrl = req.file.path;
      } else {
        bookOps[ops] = req.body[ops];
      }
    }

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
      message: "Un-Authorized",
    });
  }
};

/**
 * only logged-in user can access Ebook Link
 */
exports.get_by_id = (req, res, next) => {
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
        const { ebookUrl, bookWithoutEbookLink } = result;
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
exports.patch = (req, res, next) => {
  if (
    res.userData.roles &&
    res.userData.roles.find((role) => {
      return role === "admin" || role === "librarian";
    })
  ) {
    //this method expect req.body to be an array
    const id = req.params.bookId;
    const updateOps = {};

    for (const ops of req.body) {
      if (ops.propName !== "_id") updateOps[ops.propName] = ops.propValue;
    }

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
      message: "Un-Authorized",
    });
  }
};

/**
 * Only Admin and Librarian can update book details
 */
exports.delete = (req, res, next) => {
  if (
    res.userData.roles &&
    res.userData.roles.find((role) => {
      return role === "admin" || role === "librarian";
    })
  ) {
    const id = req.params.bookId;
    Book.deleteOne({ _id: id })
      .exec()
      .then((result) => {
        console.log(result);
        //result.deletedCount is 0 no data matches with that id
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
      message: "Un-Authorized",
    });
  }
};
