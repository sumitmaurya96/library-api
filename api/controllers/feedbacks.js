const mongoose = require("mongoose");
const qs = require("qs");
//models
const Feedback = require("../models/feedbacks");

/**
 * Get Feedbacks
 */
exports.getFeedbacks = (req, res, next) => {
  /**
   * dateDesc=true
   */
  const queryObj = qs.parse(req.params.query, {
    ignoreQueryPrefix: true,
  });

  const sortOrder = queryObj.dateDesc === "true" ? -1 : 1;
  //console.log(queryObj);

  if (queryObj.pageSize) {
    queryObj.pageSize = parseInt(queryObj.pageSize);
    if (`${queryObj.pageSize}` === "NaN") {
      queryObj.pageSize = null;
    }
  }

  if (queryObj.pageNumber) {
    queryObj.pageNumber = parseInt(queryObj.pageNumber);
    if (`${queryObj.pageNumber}` === "NaN") {
      queryObj.pageNumber = null;
    }
  }

  if (queryObj.limit) {
    queryObj.limit = parseInt(queryObj.limit);
    if (`${queryObj.limit}` === "NaN") {
      queryObj.limit = null;
    }
  }

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

  const findResultCb = (totalMachedItems) => {
    Feedback.find()
      .sort({ date: sortOrder })
      .skip((pageNumber - 1) * pageSize)
      .limit(limit)
      .exec()
      .then((results) => {
        res.status(200).json({
          total: totalMachedItems,
          count: results.length,
          feedbacks: results.map((result) => {
            return result._doc;
          }),
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: "from GET /feedbacks",
          error: err,
        });
      });
  };

  Feedback.countDocuments((err, count) => {
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
 * New feedback creation
 * Public
 */
exports.addNewFeedback = (req, res, next) => {
  const feedbackOps = {
    name: req.body.name,
    email: req.body.email,
    feedback: [req.body.feedback],
  };

  Feedback.findOne({ email: req.body.email })
    .exec()
    .then((result) => {
      console.log(result);
      if (!result) {
        const feedback = new Feedback({
          _id: new mongoose.Types.ObjectId(),
          ...feedbackOps,
        });

        feedback
          .save()
          .then((result) => {
            console.log(result);
            res.status(201).json({
              message: "Feedback created",
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({ from: "POST /feedbacks", error: err });
          });
      } else {
        Feedback.updateOne(
          { email: req.body.email },
          { $push: { feedback: req.body.feedback } }
        )
          .then((result) => {
            console.log(result);
            res.status(201).json({
              message: "New feedback Pushed",
            });
          })
          .catch((err) => {
            console.log(err);
            res
              .status(500)
              .json({ from: "POST,UPDATE /feedbacks", error: err });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ from: "POST  /feedbacks", error: err });
    });
};

/**
 * id or email
 */
exports.getFeedbackById = (req, res, next) => {
  Feedback.findOne({
    $or: [
      {
        _id: req.params.feedbackId,
      },
      {
        email: req.params.feedbackId,
      },
    ],
  })
    .exec()
    .then((result) => {
      console.log(result);
      if (!result) {
        res.status(404).json({
          message: "Not found",
        });
      } else {
        res.status(200).json(result);
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ from: "GET  /feedbacks/:id", error: err });
    });
};
