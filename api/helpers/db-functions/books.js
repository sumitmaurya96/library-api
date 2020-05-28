//Schema
const Book = require("../../models/orders");

const updateOneBookCount = (errorCb, getResultCb, query, updateProps) => {
  return new Promise((resolve, reject) => {
    Book.updateOne(query, updateProps)
      .exec()
      .then((result) => {
        resolve(result);
        //getResultCb(result);
      })
      .catch((err) => {
        reject(err);
        //errorCb(err);
      });
  });
};

module.exports = {
  updateOneBookCount,
};
