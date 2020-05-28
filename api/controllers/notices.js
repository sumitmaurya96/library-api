const mongoose = require("mongoose");
const qs = require("qs");
//models
const Notice = require("../models/notices");
//Roles
const { admin, librarian } = require("../roles/roles");
const { contains } = require("../helpers/algorithms");

/**
 * Get Notices
 */
exports.getNotices = (req, res, next) => {
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
    Notice.find()
      .sort({ date: sortOrder })
      .skip((pageNumber - 1) * pageSize)
      .limit(limit)
      .exec()
      .then((results) => {
        //console.log(totalMachedItems);
        res.status(200).json({
          total: totalMachedItems,
          count: results.length,
          notices: results.map((result) => {
            return result._doc;
          }),
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: "from GET /notices",
          error: err,
        });
      });
  };

  Notice.find().countDocuments((err, count) => {
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
 * New notice creation
 * Only Admin and Librarian can add new notice
 */
exports.addNewNotice = (req, res, next) => {
  const noticeOps = {
    title: req.body.title,
    details: req.body.details,
  };

  if (req.body.link) {
    noticeOps["link"] = req.body.link;
  }

  const notice = new Notice({
    _id: new mongoose.Types.ObjectId(),
    ...noticeOps,
  });

  notice
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Notice created",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ from: "POST /notices", error: err });
    });
};

/**
 * Public
 */
exports.getNoticeById = (req, res, next) => {
  Notice.findOne({ _id: req.params.noticeId })
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
      res.status(500).json({ from: "GET  /notices/:id", error: err });
    });
};

/**
 * Only Admin and Librarian can update notice details
 */
exports.updateNotice = (req, res, next) => {
  const updateOps = {};

  const validNoticeProps = ["title", "details", "link"];
  for (const ops in req.body) {
    if (contains.call(validNoticeProps, ops)) {
      updateOps[ops] = req.body[ops];
    }
  }

  Notice.updateOne({ _id: req.params.noticeId }, { $set: { ...updateOps } })
    .exec()
    .then((result) => {
      console.log(result);
      res.status(200).json({
        message: "Updated",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        from: "UPDATE /notice/:id",
        error: err,
      });
    });
};

/**
 * Only Admin and Librarian can update notice details
 */
exports.deleteNotice = (req, res, next) => {
  Notice.deleteOne({ _id: req.params.noticeId })
    .exec()
    .then((result) => {
      console.log(result);
      //If result.deletedCount is 0, no data matches with that id
      if (result.deletedCount) {
        res.status(200).json({
          message: "Deleted Successfully",
        });
      } else {
        res.status(404).json({
          message: "Not found",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ from: "DELETE  /notices/:id", error: err });
    });
};
