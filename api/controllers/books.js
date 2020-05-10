//models
const Book = require("../models/books");

exports.get_all = (req, res, next) => {
  Book.find()
    .select("name price _id bookImage")
    .exec()
    .then((result) => {
      res.status(200).json({
        count: result.length,
        books: result.map((doc) => {
          return {
            ...doc._doc,
            request: {
              type: "GET",
              url: `http://localhost:5000/books/${doc._id}`,
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

exports.post = (req, res, next) => {
  console.log(req.file);

  const book = new Book({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    bookImage: req.file.path,
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
};

exports.get_by_id = (req, res, next) => {
  const id = req.params.bookId;
  Book.findById(id)
    .exec()
    .then((result) => {
      console.log(result);
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(404).json({});
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ from: "GET/books/:id", error: err });
    });
};

exports.patch = (req, res, next) => {
  //this method expect req.body to be an array
  const id = req.params.bookId;
  const updateOps = {};

  for (const ops of req.body) {
    updateOps[ops.propName] = ops.propValue;
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
};

exports.delete = (req, res, next) => {
  const id = req.params.bookId;
  Book.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      console.log(result);
      //result.deletedCount is 0 no data matches with that id
      res.status(200).json(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ from: "DELETE/books/:id", error: err });
    });
};
