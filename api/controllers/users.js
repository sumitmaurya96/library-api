const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const qs = require("qs");

//Roles
const { admin, librarian, faculty, student } = require("../roles/roles");

/**
 * Helper functions
 */
const { contains } = require("../helpers/algorithms");

const {
  findOneUser,
  findUsersByQuery,
  addOneUser,
  updateOneUser,
  deleteOneUser,
} = require("../helpers/db-functions/users");

const {
  addOneOrder,
  deleteOneOrder,
} = require("../helpers/db-functions/orders");

//valid roles
const validRoles = [librarian, faculty, student, admin];

/**
 * Add Users
 */

exports.addUserOrAdmin = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const addUserHelper = (roles) => {
    const getResultCb = (result) => {
      if (result) {
        res.status(409).json({
          message: "User Already Exsist",
        });
      } else {
        //Change after adding joi
        const user = {
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          username: req.body.username,
          email: req.body.email,
          role: req.body.role,
        };

        const addUserCb = (result) => {
          //Add user order bucket
          const orderBucketDetails = {
            username: req.body.username,
          };

          if (req.body.role === faculty) {
            orderBucketDetails["borrowLimit"] = 50;
            addOneOrder(req, res, orderBucketDetails);
          } else if (req.body.role === student) {
            addOneOrder(req, res, orderBucketDetails);
          } else {
            res.status(201).json({
              message: "Success",
            });
          }
        };

        addOneUser(errorCb, addUserCb, user, req.body.password);
      }
    };

    findOneUser(errorCb, getResultCb, { username: req.body.username });
  };

  /**
   * Who can add whoom
   */
  if (contains.call(validRoles, req.body.role)) {
    if (res.userData.role === admin) {
      if (req.body.role === admin) {
        if (req.body.adminKey === process.env.SUPERUSER_KEY) {
          addUserHelper();
        } else {
          res.status(401).json({
            message: "Unauthorized",
          });
        }
      } else {
        addUserHelper();
      }
    } else if (res.userData.role === librarian) {
      if (req.body.role === admin || req.body.role === librarian) {
        res.status(401).json({
          message: "Unauthorized",
        });
      } else {
        addUserHelper();
      }
    } else {
      res.status(401).json({
        message: "Unauthorized",
      });
    }
  } else {
    res.status(400).json({
      message: "Not a Valid Role",
    });
  }
};

/**
 * Login User
 */
exports.loginUser = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (result) => {
    if (result) {
      bcrypt.compare(
        req.body.password,
        result.password,
        (err, decryptedRes) => {
          if (err) {
            return res.status(401).json({
              message: "Email or Password Incorrect",
            });
          }

          if (decryptedRes) {
            const token = jwt.sign(
              {
                sub: result._id,
              },
              process.env.TOKEN_ENCRYPTION_KEY,
              {
                expiresIn: "1h",
              }
            );

            res.status(200).json({
              message: "Authentication Successful",
              token: token,
            });
          } else {
            res.status(401).json({
              message: "Email or Password Incorrect",
            });
          }
        }
      );
    } else {
      res.status(401).json({
        message: "Email or Password Incorrect",
      });
    }
  };

  const query = req.body.username
    ? { username: req.body.username }
    : { email: req.body.email };

  findOneUser(errorCb, getResultCb, query);
};

/**
 * Get User By Id
 * Anyone can find its own data
 */
exports.getYourSelf = (req, res, next) => {
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (result) => {
    if (result) {
      const { password, ...resultWithoutPassword } = result._doc;
      res.status(200).json({
        ...resultWithoutPassword,
      });
    } else {
      res.status(404).json({
        message: "User Does Not Exsist",
      });
    }
  };

  findOneUser(errorCb, getResultCb, { _id: res.userData.id });
};

/**
 * GET
 * All users not admins
 * only admin can access
 */
exports.getAllUsers = (req, res, next) => {
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (results) => {
    res.status(200).json({
      count: results.length,
      users: results.map((user) => {
        const { password, ...resultWithoutPassword } = user._doc;
        return resultWithoutPassword;
      }),
    });
  };

  findUsersByQuery(errorCb, getResultCb, {
    $or: [{ role: student }, { role: faculty }, { role: librarian }],
  });
};

/**
 * POST
 * All admins
 * only admin can access with key
 */
exports.getAllAdmins = (req, res, next) => {
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (results) => {
    res.status(200).json({
      count: results.length,
      admins: results.map((admin) => {
        const { password, ...resultWithoutPassword } = admin._doc;
        return resultWithoutPassword;
      }),
    });
  };

  if (req.body.adminKey === process.env.SUPERUSER_KEY) {
    findUsersByQuery(errorCb, getResultCb, {
      $or: [{ role: admin }],
    });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * GET
 * get user by username or id
 * only admin can access with key
 * username=<>
 * id=<>
 */
exports.getUserByUsernameOrId = (req, res, next) => {
  const queryObj = qs.parse(req.params.query);

  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getResultCb = (result) => {
    if (result) {
      const { password, ...resultWithoutPassword } = result._doc;
      res.status(200).json({
        ...resultWithoutPassword,
      });
    } else {
      res.status(404).json({
        message: "User Does Not Exsist",
      });
    }
  };

  let query = queryObj.username
    ? { username: queryObj.username }
    : { _id: queryObj.id };

  findOneUser(errorCb, getResultCb, {
    $or: [{ role: student }, { role: faculty }, { role: librarian }],
    ...query,
  });
};

/**
 * any user can update itself
 * admin can update any user
 */
exports.updateUser = (req, res, next) => {
  const query = qs.parse(req.params.query);
  if (query.delLike) {
    query.delLike = query.delLike === "true";
  }
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const validUpdateProps = ["firstname", "lastname", "password"];
  const updateObj = {};

  //req.body is expected to be an array
  for (const ops in req.body) {
    if (contains.call(validUpdateProps, ops)) {
      updateObj[ops] = req.body[ops];
    }
  }

  if (req.file) {
    updateObj["profilePicUrl"] = req.file.path;
  }

  const updateQueryProps = { $set: updateObj };

  if (req.body.favourites) {
    const favourites = [];
    for (const id of req.body.favourites) {
      favourites.push({
        abc: id,
      });
    }

    updateQueryProps["$push"] = {
      favourites: { $each: [...favourites] },
    };
  }

  console.log(req.body.favourites);
  console.log(updateQueryProps);

  const updateUserHelper = (roles) => {
    const getResultCb = (user) => {
      if (user) {
        const updateUserCb = (result) => {
          if (result) {
            if (result.nModified) {
              res.status(200).json({
                message: "Successful",
              });
            } else {
              res.status(501).json({
                message: "Not Updated",
              });
            }
          }
        };

        updateOneUser(
          errorCb,
          updateUserCb,
          { _id: req.params.id },
          updateQueryProps
        );
      } else {
        res.status(404).json({
          message: "User Not Found",
        });
      }
    };

    const roleFilter = [];
    for (const role of roles) {
      roleFilter.push({ role: role });
    }

    findOneUser(errorCb, getResultCb, { $or: roleFilter, _id: req.params.id });
  };

  if (res.userData.id === req.params.id) {
    updateUserHelper([librarian, faculty, student, admin]);
  } else {
    if (res.userData.role === admin) {
      if (req.body.adminKey === process.env.SUPERUSER_KEY) {
        updateUserHelper([librarian, faculty, student, admin]);
      } else {
        updateUserHelper([librarian, faculty, student]);
      }
    } else {
      res.status(401).json({
        message: "Unauthorized",
      });
    }
  }
};

/**
 * any user can delete itself
 * admin can delete any user
 */
exports.deleteUser = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const deleteUserHelper = (roles) => {
    const getResultCb = (user) => {
      const deleteUserCb = (result) => {
        if (result) {
          if (result.deletedCount) {
            if (user.role === faculty || user.role === student) {
              deleteOneOrder(req, res, { username: user.username });
            } else {
              res.status(200).json({
                message: "Successful",
              });
            }
          } else {
            res.status(400).json({
              message: "Not Deleted",
            });
          }
        } else {
          res.status(404).json({
            message: "User Not found",
          });
        }
      };

      const roleFilter = [];
      for (const role of roles) {
        roleFilter.push({ role: role });
      }

      deleteOneUser(errorCb, deleteUserCb, {
        $or: roleFilter,
        _id: req.params.id,
      });
    };

    findOneUser(errorCb, getResultCb, { _id: req.params.id });
  };

  if (res.userData.id === req.params.id) {
    deleteUserHelper([librarian, faculty, student, admin]);
  } else {
    if (res.userData.role === admin) {
      deleteUserHelper([librarian, faculty, student]);
    } else {
      res.status(401).json({
        message: "Unauthorized",
      });
    }
  }
};
