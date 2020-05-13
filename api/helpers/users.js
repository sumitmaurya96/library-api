const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
//Schema
const User = require("../models/users");

const findOneUser = (errorCb, getResultCb, query) => {
  User.findOne(query)
    .exec()
    .then((result) => {
      getResultCb(result);
    })
    .catch((err) => {
      errorCb(err);
    });
};

const findUsersByQuery = (errorCb, getResultsCb, query) => {
  User.find(query)
    .exec()
    .then((results) => {
      getResultsCb(results);
    })
    .catch((err) => {
      errorCb(err);
    });
};

const addOneUser = (errorCb, getResultsCb, userSchemaObject, password) => {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      errorCb(err);
    } else {
      const user = new User({
        _id: mongoose.Types.ObjectId(),
        password: hash,
        ...userSchemaObject,
      });

      user
        .save()
        .then((result) => {
          getResultsCb(result);
        })
        .catch((err) => {
          errorCb(err);
        });
    }
  });
};

const updateOneUser = (errorCb, getResultCb, query, updateProps) => {
  const updateOneUserHelper = (props) => {
    User.updateOne(query, { $set: { ...props } })
      .exec()
      .then((result) => {
        getResultCb(result);
      })
      .catch((err) => {
        errorCb(err);
      });
  };

  const { password } = updateProps;
  if (password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        errorCb(err);
      } else {
        updateProps.password = hash;
        updateOneUserHelper(updateProps);
      }
    });
  } else {
    updateOneUserHelper(updateProps);
  }
};

const deleteOneUser = (errorCb, getResultCb, query) => {
  User.deleteOne(query)
    .exec()
    .then((result) => {
      getResultCb(result);
    })
    .catch((err) => {
      errorCb(err);
    });
};

module.exports = {
  findOneUser,
  findUsersByQuery,
  addOneUser,
  updateOneUser,
  deleteOneUser,
};
