//Schema
const Admin = require("../models/admins");

const findOneAdmin = (errorCb, getResultCb, query) => {
  Admin.findOne(query)
    .exec()
    .then((result) => {
      getResultCb(result);
    })
    .catch((err) => {
      errorCb(err);
    });
};

const findAdminsByQuery = (errorCb, getResultsCb, query) => {
  Admin.find(query)
    .exec()
    .then((results) => {
      getResultsCb(results);
    })
    .catch((err) => {
      errorCb(err);
    });
};

const updateOneAdmin = (errorCb, getResultCb, query, updateProps) => {
  Admin.updateOne(query, { $set: { ...updateProps } })
    .exec()
    .then((result) => {
      getResultCb(result);
    })
    .catch((err) => {
      errorCb(err);
    });
};

const deleteOneAdmin = (errorCb, getResultCb, query) => {
  Admin.deleteOne(query)
    .exec()
    .then((result) => {
      getResultCb(result);
    })
    .catch((err) => {
      errorCb(err);
    });
};

module.exports = {
  findOneAdmin,
  findAdminsByQuery,
  updateOneAdmin,
  deleteOneAdmin,
};
