const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const queryString = require("query-string");

//Roles
const {
  admin,
  librarian,
  faculty,
  student,
} = require("../../roles-config/roles");

/**
 * Helper functions
 */
const { contains } = require("../../helpers/algorithms");

const {
  findOneUser,
  findUsersByQuery,
  addOneUser,
  updateOneUser,
  deleteOneUser,
} = require("../../helpers/users");

/**
 * Login User
 */
exports.loginUser = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const isValidUser = contains.call(
    [librarian.id, faculty.id, student.id],
    req.body.role
  );

  if (isValidUser) {
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
                  firstname: result.firstname,
                  lastname: result.lastname,
                  username: result.username,
                  role: result.role,
                  email: result.email,
                  id: result._id,
                },
                process.env.TOKEN_ENCRYPTION_KEY,
                {
                  expiresIn: "1h",
                }
              );

              res.status(200).json({
                message: "Auth Successful",
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

    findOneUser(errorCb, getResultCb, { email: req.body.email });
  } else {
    res.status(400).json({
      message: "Not a Valid Role",
    });
  }
};

/**
 * Add Users
 */

exports.addUser = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const addUserHelper = (roles) => {
    //console.log(contains.call(roles, req.body.role));
    //console.log(contains.call(roles, req.body.role));
    //console.log(roles);

    if (contains.call(roles, req.body.role)) {
      const getResultCb = (result) => {
        if (result) {
          res.status(409).json({
            message: "User Already Exsist",
          });
        } else {
          const user = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            role: req.body.role,
          };

          if (req.body.role === student.id) {
            user["username"] = req.body.username;
          } else {
            user["username"] =
              typeof req.body.email === "string"
                ? req.body.email.split("@")[0]
                : null;
          }

          const addUserCb = (result) => {
            res.status(201).json({
              isAdded: true,
              message: "Success",
            });
          };

          addOneUser(errorCb, addUserCb, user, req.body.password);
        }
      };

      findOneUser(errorCb, getResultCb, { email: req.body.email });
    } else {
      res.status(400).json({
        message: "Not a Valid Role",
      });
    }
  };

  if (res.userData.role === admin.id) {
    addUserHelper([librarian.id, faculty.id, student.id]);
  } else if (res.userData.role === librarian.id) {
    addUserHelper([faculty.id, student.id]);
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * Get Userl By Id
 */
exports.getUserById = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const getUserHelper = (roles) => {
    const getResultCb = (result) => {
      if (result) {
        const { password, ...resultWithoutPassword } = result._doc;
        res.status(404).json({
          ...resultWithoutPassword,
        });
      } else {
        res.status(404).json({
          message: "User Does Not Exsist",
        });
      }
    };

    const roleFilter = [];
    for (const role of roles) {
      roleFilter.push({ role: role });
    }

    findOneUser(errorCb, getResultCb, {
      $or: roleFilter,
      _id: req.params.id,
    });
  };

  if (res.userData.role === admin.id) {
    getUserHelper([librarian.id, faculty.id, student.id]);
  } else if (res.userData.role === librarian) {
    getUserHelper([faculty.id, student.id]);
  } else {
    if (req.params.id === res.userData.id) {
      getUserHelper([student.id]);
    } else {
      res.status(401).json({
        message: "Unauthorized",
      });
    }
  }
};

/**
 * Get All Users
 */
exports.getUsers = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  if (res.userData.role === admin.id) {
    /**
     * Parse Query string and convert it to object
     * This will be a mongoDB query
     * so admin can give any query
     */
    const query = queryString.parse(req.params.query);
    // console.log(req.params.query);
    // console.log(query);

    const getResultCb = (results) => {
      res.status(200).json({
        count: results.length,
        users: results.map((result) => {
          const { password, ...resultWithoutPassword } = result._doc;
          return resultWithoutPassword;
        }),
      });
    };

    findUsersByQuery(errorCb, getResultCb, query);
  } else if (res.userData.role === librarian.id) {
    const query = queryString.parse(res.params.query);
    const getResultCb = (results) => {
      const students = [...results];
      const faculties = [...results];

      students.map((result) => {
        const { password, ...resultWithoutPassword } = result._doc;
        return resultWithoutPassword;
      });

      faculties.map((result) => {
        const { password, ...resultWithoutPassword } = result._doc;
        return resultWithoutPassword;
      });

      res.status(200).json({
        students: {
          count: students.length,
          data: students,
        },
        faculties: {
          count: faculties.length,
          data: faculties,
        },
      });
    };

    findUsersByQuery(errorCb, getResultCb, {
      $or: [{ role: student.id }, { role: faculty.id }],
      query,
    });
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * admin can update any user
 * librarian can update faculty and student
 * any user can update itself
 * request Body is an Array
 * [{propName:"password", propValue:"12345678"},{propName:"firstname", propValue:"Rakesh"}]
 */
exports.updateUser = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const updateProps = {};
  //req.body is expected to be an array
  for (const ops of req.body) {
    if (
      ops.propName !== "cardNumber" &&
      ops.propName !== "email" &&
      ops.propName !== "_id" &&
      ops.propName !== "role"
    ) {
      updateProps[ops.propName] = ops.propValue;
    }
  }

  const updateUserHelper = (roles) => {
    const getResultCb = (result) => {
      if (result) {
        if (result.nModified) {
          res.status(200).json({
            message: "Successful",
          });
        } else {
          res.status(400).json({
            message: "Not Updated",
          });
        }
      }
    };

    const roleFilter = [];
    for (const role of roles) {
      roleFilter.push({ role: role });
    }

    updateOneUser(
      errorCb,
      getResultCb,
      { $or: roleFilter, _id: req.params.id },
      updateProps
    );
  };

  if (res.userData.role === admin.id) {
    updateUserHelper([librarian.id, faculty.id, student.id]);
  } else if (res.userData.role === librarian.id) {
    if (res.userData.id === req.params.id) {
      updateUserHelper([librarian.id]);
    } else {
      updateUserHelper([faculty.id, student.id]);
    }
  } else if (
    contains.call([student.id, faculty.id], res.userData.role) &&
    res.userData.id === req.params.id
  ) {
    updateUserHelper([faculty.id, student.id]);
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/**
 * admin can delete any user
 * librarian can delete faculty and student
 * any user can delete itself
 */
exports.deleteUser = (req, res, next) => {
  //ErrorCallBack
  const errorCb = (err) => {
    res.status(500).json({ error: err });
  };

  const deleteUserHelper = (roles) => {
    const getResultCb = (result) => {
      if (result) {
        if (result.deletedCount) {
          res.status(200).json({
            message: "Successful",
          });
        } else {
          res.status(400).json({
            message: "Not Deleted",
          });
        }
      }
    };

    const roleFilter = [];
    for (const role of roles) {
      roleFilter.push({ role: role });
    }

    deleteOneUser(errorCb, getResultCb, {
      $or: roleFilter,
      _id: req.params.id,
    });
  };

  if (res.userData.role === admin.id) {
    deleteUserHelper([librarian.id, faculty.id, student.id]);
  } else if (res.userData.role === librarian.id) {
    if (res.userData.id === req.params.id) {
      deleteUserHelper([librarian.id]);
    } else {
      deleteUserHelper([faculty.id, student.id]);
    }
  } else if (
    contains.call([student.id, faculty.id], res.userData.role) &&
    res.userData.id === req.params.id
  ) {
    deleteUserHelper([faculty.id, student.id]);
  } else {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};
